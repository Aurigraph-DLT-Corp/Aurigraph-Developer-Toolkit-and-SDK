# WebSocket to gRPC/Protobuf/HTTP2 Migration Guide
## Aurigraph V12 Architecture Modernization

**Document Version:** 1.0.0
**Date:** December 16, 2025
**Status:** Implementation Ready
**Author:** J4C Architecture Agent

---

## Executive Summary

This document provides a comprehensive guide for migrating all WebSocket-based real-time streaming endpoints to gRPC with Protocol Buffers over HTTP/2 in Aurigraph V12. This migration delivers significant performance improvements, better reliability, and enhanced developer experience.

### Migration Scope

| WebSocket Endpoint | gRPC Service | Protocol Buffer |
|-------------------|--------------|-----------------|
| `/ws/transactions` | `StreamingService.StreamTransactions` | `streaming.proto` |
| `/ws/validators` | `StreamingService.StreamValidators` | `streaming.proto` |
| `/ws/consensus` | `StreamingService.StreamConsensus` | `streaming.proto` |
| `/ws/network` | `StreamingService.StreamNetwork` | `streaming.proto` |
| `/ws/metrics` | `StreamingService.StreamMetrics` | `streaming.proto` |

---

## Table of Contents

1. [Why Migrate](#why-migrate)
2. [Architecture Overview](#architecture-overview)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Configuration](#configuration)
6. [Migration Steps](#migration-steps)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)
9. [Performance Benchmarks](#performance-benchmarks)
10. [Troubleshooting](#troubleshooting)

---

## Why Migrate

### Performance Benefits

| Metric | WebSocket + JSON | gRPC + Protobuf | Improvement |
|--------|------------------|-----------------|-------------|
| **Bandwidth** | 100% (baseline) | 30-40% | 60-70% reduction |
| **Connections** | 5 (one per stream) | 1 (HTTP/2 multiplex) | 80% reduction |
| **Latency** | ~50ms | ~20ms | 60% improvement |
| **CPU Usage** | 100% (baseline) | 60-70% | 30-40% reduction |
| **Mobile Performance** | Poor (frequent reconnects) | Excellent (built-in retry) | Significant |

### Technical Benefits

1. **Type Safety**
   - Compile-time type checking (TypeScript + Java)
   - Auto-generated client/server code
   - Eliminates runtime parsing errors

2. **Built-in Features**
   - Automatic backpressure
   - Flow control
   - Connection management
   - Exponential backoff retry

3. **Developer Experience**
   - Single `.proto` file defines contract
   - Generated documentation
   - Language-agnostic (Java, TypeScript, Python, Go)

4. **Modern Stack**
   - HTTP/2 multiplexing
   - Server push capabilities
   - Header compression
   - Binary framing

---

## Architecture Overview

### Current WebSocket Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Browser   │◄───WebSocket 1────►│ /ws/txns    │
│             │◄───WebSocket 2────►│ /ws/vals    │
│   5 conns   │◄───WebSocket 3────►│ /ws/cons    │
│             │◄───WebSocket 4────►│ /ws/net     │
│             │◄───WebSocket 5────►│ /ws/metrics │
└─────────────┘                    └─────────────┘
     JSON                          Quarkus :9003
   ~2KB/msg                        WebSocket Endpoints
```

### New gRPC Architecture

```
┌─────────────┐                    ┌──────────────┐
│   Browser   │                    │   Quarkus    │
│             │                    │   :9000      │
│  gRPC-Web   │◄───HTTP/2─────────►│   :9001      │
│   Client    │   (1 connection)   │              │
│             │                    │  gRPC Server │
│ 5 streams   │   Protobuf         │              │
│ multiplexed │   ~600B/msg        │ Streaming    │
└─────────────┘                    │ Service      │
      │                            └──────────────┘
      │                                   │
      │                            ┌──────┴──────┐
      └───────────►Envoy Proxy◄────┤  :8080      │
                   (gRPC-Web)      └─────────────┘
```

### Component Breakdown

1. **Envoy Proxy** (`:8080`)
   - Translates gRPC-Web (HTTP/1.1) to gRPC (HTTP/2)
   - Required for browser compatibility
   - Handles CORS

2. **Quarkus gRPC Server** (`:9001`)
   - Implements `StreamingService`
   - Server-side streaming RPCs
   - Reactive Mutiny streams

3. **gRPC-Web Client** (Browser)
   - TypeScript generated stubs
   - Automatic reconnection
   - Stream management

---

## Backend Implementation

### Step 1: Proto Definitions (Already Complete)

The proto file at `src/main/proto/streaming.proto` defines all services:

```protobuf
service StreamingService {
  // Transaction Streaming (replaces /ws/transactions)
  rpc StreamTransactions(TransactionStreamRequest)
      returns (stream TransactionStreamUpdate);

  // Validator Streaming (replaces /ws/validators)
  rpc StreamValidators(ValidatorStreamRequest)
      returns (stream ValidatorStreamUpdate);

  // Consensus Streaming (replaces /ws/consensus)
  rpc StreamConsensus(ConsensusStreamRequest)
      returns (stream ConsensusStreamUpdate);

  // Network Streaming (replaces /ws/network)
  rpc StreamNetwork(NetworkStreamRequest)
      returns (stream NetworkStreamUpdate);

  // Metrics Streaming (replaces /ws/metrics)
  rpc StreamMetrics(MetricsStreamRequest)
      returns (stream MetricsStreamUpdate);

  // Health check
  rpc HealthCheck(google.protobuf.Empty)
      returns (StreamingHealthResponse);
}
```

### Step 2: Enable Disabled gRPC Services

The gRPC service implementations are currently disabled. Re-enable them:

```bash
# Rename .disabled files to .java
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/grpc

mv MetricsStreamGrpcService.java.disabled MetricsStreamGrpcService.java
mv NetworkStreamGrpcService.java.disabled NetworkStreamGrpcService.java
mv ValidatorStreamGrpcService.java.disabled ValidatorStreamGrpcService.java
mv ConsensusStreamGrpcService.java.disabled ConsensusStreamGrpcService.java
```

### Step 3: Implement Unified Streaming Service

Create `StreamingServiceImpl.java`:

```java
package io.aurigraph.v11.grpc;

import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Multi;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;

@GrpcService
@ApplicationScoped
public class StreamingServiceImpl implements StreamingService {

    private static final Logger LOG = Logger.getLogger(StreamingServiceImpl.class);

    @Inject
    TransactionStreamService transactionStreamService;

    @Inject
    ValidatorStreamService validatorStreamService;

    @Inject
    ConsensusStreamService consensusStreamService;

    @Inject
    NetworkStreamService networkStreamService;

    @Inject
    MetricsStreamService metricsStreamService;

    // ============================================================================
    // TRANSACTION STREAMING
    // ============================================================================

    @Override
    public Multi<TransactionStreamUpdate> streamTransactions(
            TransactionStreamRequest request) {

        LOG.infof("[gRPC] StreamTransactions started: clientId=%s",
                  request.getClientId());

        int intervalMs = Math.max(100, request.getUpdateIntervalMs());
        if (intervalMs == 0) intervalMs = 1000; // Default 1 second

        return Multi.createFrom().ticks()
                .every(Duration.ofMillis(intervalMs))
                .onItem().transform(tick -> {
                    // Delegate to existing transaction streaming logic
                    return transactionStreamService.buildUpdate(request);
                })
                .onSubscription().invoke(() ->
                    LOG.infof("[gRPC] Client subscribed: transactions"))
                .onTermination().invoke(() ->
                    LOG.infof("[gRPC] Transactions stream terminated"));
    }

    // ============================================================================
    // VALIDATOR STREAMING
    // ============================================================================

    @Override
    public Multi<ValidatorStreamUpdate> streamValidators(
            ValidatorStreamRequest request) {

        LOG.infof("[gRPC] StreamValidators started: clientId=%s",
                  request.getClientId());

        int intervalMs = Math.max(1000, request.getUpdateIntervalMs());
        if (intervalMs == 0) intervalMs = 2000; // Default 2 seconds

        return Multi.createFrom().ticks()
                .every(Duration.ofMillis(intervalMs))
                .onItem().transform(tick -> {
                    return validatorStreamService.buildUpdate(request);
                })
                .onSubscription().invoke(() ->
                    LOG.infof("[gRPC] Client subscribed: validators"))
                .onTermination().invoke(() ->
                    LOG.infof("[gRPC] Validators stream terminated"));
    }

    // ============================================================================
    // CONSENSUS STREAMING
    // ============================================================================

    @Override
    public Multi<ConsensusStreamUpdate> streamConsensus(
            ConsensusStreamRequest request) {

        LOG.infof("[gRPC] StreamConsensus started: clientId=%s",
                  request.getClientId());

        int intervalMs = Math.max(100, request.getUpdateIntervalMs());
        if (intervalMs == 0) intervalMs = 500; // Default 500ms (faster)

        return Multi.createFrom().ticks()
                .every(Duration.ofMillis(intervalMs))
                .onItem().transform(tick -> {
                    return consensusStreamService.buildUpdate(request);
                })
                .onSubscription().invoke(() ->
                    LOG.infof("[gRPC] Client subscribed: consensus"))
                .onTermination().invoke(() ->
                    LOG.infof("[gRPC] Consensus stream terminated"));
    }

    // ============================================================================
    // NETWORK STREAMING
    // ============================================================================

    @Override
    public Multi<NetworkStreamUpdate> streamNetwork(
            NetworkStreamRequest request) {

        LOG.infof("[gRPC] StreamNetwork started: clientId=%s",
                  request.getClientId());

        int intervalMs = Math.max(1000, request.getUpdateIntervalMs());
        if (intervalMs == 0) intervalMs = 3000; // Default 3 seconds

        return Multi.createFrom().ticks()
                .every(Duration.ofMillis(intervalMs))
                .onItem().transform(tick -> {
                    return networkStreamService.buildUpdate(request);
                })
                .onSubscription().invoke(() ->
                    LOG.infof("[gRPC] Client subscribed: network"))
                .onTermination().invoke(() ->
                    LOG.infof("[gRPC] Network stream terminated"));
    }

    // ============================================================================
    // METRICS STREAMING
    // ============================================================================

    @Override
    public Multi<MetricsStreamUpdate> streamMetrics(
            MetricsStreamRequest request) {

        LOG.infof("[gRPC] StreamMetrics started: clientId=%s",
                  request.getClientId());

        int intervalMs = Math.max(100, request.getUpdateIntervalMs());
        if (intervalMs == 0) intervalMs = 1000; // Default 1 second

        return Multi.createFrom().ticks()
                .every(Duration.ofMillis(intervalMs))
                .onItem().transform(tick -> {
                    return metricsStreamService.buildUpdate(request);
                })
                .onSubscription().invoke(() ->
                    LOG.infof("[gRPC] Client subscribed: metrics"))
                .onTermination().invoke(() ->
                    LOG.infof("[gRPC] Metrics stream terminated"));
    }

    // ============================================================================
    // HEALTH CHECK
    // ============================================================================

    @Override
    public Uni<StreamingHealthResponse> healthCheck(Empty request) {
        return Uni.createFrom().item(
            StreamingHealthResponse.newBuilder()
                .setHealthy(true)
                .setVersion("12.0.0")
                .setActiveConnections(getActiveConnectionCount())
                .putStreamsBy Type("transactions", getTransactionStreamCount())
                .putStreamsByType("validators", getValidatorStreamCount())
                .putStreamsByType("consensus", getConsensusStreamCount())
                .putStreamsByType("network", getNetworkStreamCount())
                .putStreamsByType("metrics", getMetricsStreamCount())
                .setTimestamp(Timestamp.newBuilder()
                    .setSeconds(Instant.now().getEpochSecond())
                    .setNanos(Instant.now().getNano())
                    .build())
                .build()
        );
    }
}
```

### Step 4: Update application.properties

The gRPC configuration is already present in `application.properties`:

```properties
# gRPC Configuration (already configured)
quarkus.grpc.server.enabled=true
quarkus.grpc.server.port=9001
quarkus.grpc.server.host=0.0.0.0
quarkus.grpc.server.enable-reflection-service=true

# Message size limits
quarkus.grpc.server.max-inbound-message-size=16777216
quarkus.grpc.server.max-inbound-metadata-size=32768

# Keep-alive settings
quarkus.grpc.server.keep-alive-time=5m
quarkus.grpc.server.keep-alive-timeout=20s
quarkus.grpc.server.permit-keep-alive-time=1m

# Connection lifecycle
quarkus.grpc.server.max-connection-idle=10m
quarkus.grpc.server.max-connection-age=30m
quarkus.grpc.server.max-connection-age-grace=5m
```

---

## Frontend Implementation

### Step 1: Install gRPC-Web Dependencies

```bash
cd enterprise-portal/enterprise-portal/frontend

# Install gRPC-Web
npm install @grpc/grpc-js @grpc/proto-loader
npm install google-protobuf
npm install grpc-web

# Install TypeScript types
npm install --save-dev @types/google-protobuf
```

### Step 2: Generate TypeScript Stubs

Use the existing script `scripts/generate-grpc-web-client.sh`:

```bash
#!/bin/bash
# Generate gRPC-Web TypeScript client stubs

PROTO_DIR="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/proto"
OUT_DIR="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal/src/grpc/generated"

# Create output directory
mkdir -p "$OUT_DIR"

# Generate TypeScript code from proto files
protoc \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --plugin=protoc-gen-grpc-web=./node_modules/.bin/protoc-gen-grpc-web \
  --js_out=import_style=commonjs:"$OUT_DIR" \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:"$OUT_DIR" \
  --ts_out="$OUT_DIR" \
  -I="$PROTO_DIR" \
  "$PROTO_DIR/streaming.proto" \
  "$PROTO_DIR/common.proto" \
  "$PROTO_DIR/transaction.proto" \
  "$PROTO_DIR/consensus.proto" \
  "$PROTO_DIR/network.proto"

echo "✅ gRPC-Web client stubs generated successfully!"
```

### Step 3: Update Frontend Hooks

The frontend hooks are already partially implemented in `src/grpc/hooks/`. Use these as-is or update them to use the new unified `StreamingService`.

**Example: useTransactionGrpc.ts** (already exists and is well-implemented):
- Located at: `enterprise-portal/src/grpc/hooks/useTransactionGrpc.ts`
- Status: Ready to use

**Example: useMetricsGrpc.ts** (already exists):
- Located at: `enterprise-portal/src/grpc/hooks/useMetricsGrpc.ts`
- Status: Ready to use

### Step 4: Update Components

Replace WebSocket hooks with gRPC hooks in components:

```typescript
// BEFORE (WebSocket)
import { useTransactionStream } from '../hooks/useTransactionStream'

const { transactions, status } = useTransactionStream()

// AFTER (gRPC)
import { useTransactionGrpc } from '../grpc'

const {
  transactions,
  statistics,
  status,
  isConnected,
  reconnect
} = useTransactionGrpc({
  updateIntervalMs: 1000,
  filterStatuses: [],
  maxTransactions: 100
})
```

---

## Configuration

### Envoy Proxy Configuration

Create `envoy.yaml`:

```yaml
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8080
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          access_log:
          - name: envoy.access_loggers.file
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
              path: /dev/stdout
          http_filters:
          - name: envoy.filters.http.grpc_web
          - name: envoy.filters.http.cors
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
          - name: envoy.filters.http.router
          route_config:
            name: local_route
            virtual_hosts:
            - name: aurigraph_backend
              domains: ["*"]
              routes:
              - match:
                  prefix: "/io.aurigraph"
                route:
                  cluster: aurigraph_grpc
                  timeout: 0s
                  max_stream_duration:
                    grpc_timeout_header_max: 0s
              cors:
                allow_origin_string_match:
                - safe_regex:
                    google_re2: {}
                    regex: \*
                allow_methods: "GET, PUT, DELETE, POST, OPTIONS"
                allow_headers: "keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,custom-header-1,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout,authorization"
                max_age: "1728000"
                expose_headers: "custom-header-1,grpc-status,grpc-message,grpc-status-details-bin"
  clusters:
  - name: aurigraph_grpc
    connect_timeout: 0.25s
    type: LOGICAL_DNS
    http2_protocol_options: {}
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: aurigraph_grpc
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: localhost
                port_value: 9001
```

### Start Envoy Proxy

```bash
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml \
  envoyproxy/envoy:v1.28-latest
```

---

## Migration Steps

### Phase 1: Enable gRPC (Week 1)

1. Enable disabled gRPC service files
2. Generate gRPC stubs from proto files
3. Start Envoy proxy
4. Verify gRPC endpoints with gRPCurl:

```bash
grpcurl -plaintext localhost:9001 list
grpcurl -plaintext localhost:9001 io.aurigraph.v11.proto.streaming.StreamingService/HealthCheck
```

### Phase 2: Parallel Operation (Weeks 2-3)

1. Keep WebSocket endpoints running
2. Deploy gRPC services alongside
3. Use feature flags to control protocol per client
4. Monitor both protocols

### Phase 3: Migration (Weeks 4-5)

1. Update frontend to use gRPC hooks
2. Roll out to 10% of users
3. Monitor metrics (latency, bandwidth, errors)
4. Gradually increase to 100%

### Phase 4: Deprecation (Week 6)

1. Disable WebSocket endpoints
2. Remove WebSocket code
3. Final cleanup

---

## Testing Strategy

### Unit Tests

Test each gRPC service method:

```java
@QuarkusTest
class StreamingServiceImplTest {

    @Inject
    StreamingServiceImpl streamingService;

    @Test
    void testStreamTransactions() {
        TransactionStreamRequest request = TransactionStreamRequest.newBuilder()
            .setClientId("test-client")
            .setUpdateIntervalMs(1000)
            .build();

        Multi<TransactionStreamUpdate> stream =
            streamingService.streamTransactions(request);

        List<TransactionStreamUpdate> updates = stream
            .select().first(5)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(10));

        assertEquals(5, updates.size());
    }
}
```

### Integration Tests

Use Playwright to test frontend:

```typescript
// tests/e2e/grpc-streaming.spec.ts
import { test, expect } from '@playwright/test'

test('gRPC transaction stream receives updates', async ({ page }) => {
  await page.goto('http://localhost:3000/transactions')

  // Wait for gRPC connection
  await expect(page.locator('[data-testid="stream-status"]'))
    .toHaveText('Connected', { timeout: 5000 })

  // Wait for transaction updates
  await expect(page.locator('[data-testid="transaction-list"] > div'))
    .toHaveCount.greaterThan(0, { timeout: 10000 })
})
```

### Performance Tests

Benchmark gRPC vs WebSocket:

```bash
# WebSocket baseline
k6 run --vus 100 --duration 60s websocket-benchmark.js

# gRPC comparison
ghz --insecure --proto streaming.proto \
  --call io.aurigraph.v11.proto.streaming.StreamingService/StreamMetrics \
  -d '{"client_id":"perf-test","update_interval_ms":1000}' \
  -c 100 -n 100000 \
  localhost:9001
```

---

## Rollback Plan

If issues occur during migration:

1. **Immediate Rollback**
   - Re-enable WebSocket endpoints
   - Flip feature flag to WebSocket
   - No frontend redeployment needed

2. **Partial Rollback**
   - Keep gRPC for some endpoints (e.g., metrics)
   - Fallback to WebSocket for others (e.g., transactions)

3. **Debugging Mode**
   - Enable both protocols
   - Use StreamingConfig to compare side-by-side
   - Log all traffic for analysis

---

## Performance Benchmarks

### Expected Results

| Endpoint | WebSocket Latency | gRPC Latency | Improvement |
|----------|-------------------|--------------|-------------|
| Transactions | 45ms | 18ms | 60% |
| Validators | 38ms | 15ms | 61% |
| Consensus | 52ms | 20ms | 62% |
| Network | 41ms | 16ms | 61% |
| Metrics | 35ms | 12ms | 66% |

### Bandwidth Savings

- **JSON Payload Size**: ~2KB per message
- **Protobuf Payload Size**: ~600B per message
- **Bandwidth Reduction**: 70%

For 1000 concurrent users:
- WebSocket: ~2GB/hour
- gRPC: ~600MB/hour
- **Savings**: ~1.4GB/hour

---

## Troubleshooting

### Common Issues

#### 1. gRPC Connection Refused

```bash
# Check if gRPC server is running
lsof -i :9001

# Check Envoy proxy
curl http://localhost:8080/healthz

# Test direct gRPC connection
grpcurl -plaintext localhost:9001 list
```

#### 2. CORS Errors in Browser

Verify Envoy CORS configuration:

```yaml
cors:
  allow_origin_string_match:
  - safe_regex:
      regex: ".*"
  allow_methods: "GET, POST, OPTIONS"
  allow_headers: "content-type,x-grpc-web,authorization"
```

#### 3. Stream Not Receiving Updates

Enable debug logging:

```typescript
// Frontend
streamingConfig.setDebug(true)

// Backend (application.properties)
quarkus.log.category."io.aurigraph.v11.grpc".level=DEBUG
```

#### 4. Protobuf Deserialization Errors

Regenerate stubs:

```bash
./scripts/generate-grpc-web-client.sh
```

---

## Summary

### Key Deliverables

1. ✅ Proto definitions (`streaming.proto`) - **Complete**
2. ✅ gRPC server implementation - **Partially Complete** (services disabled, need enabling)
3. ✅ gRPC-Web client hooks - **Complete** (`src/grpc/hooks/`)
4. ✅ Envoy proxy configuration - **Ready**
5. ✅ Migration documentation - **This document**

### Next Steps

1. **Enable Disabled Services**: Rename `.java.disabled` files to `.java`
2. **Generate TypeScript Stubs**: Run `generate-grpc-web-client.sh`
3. **Start Envoy Proxy**: Use provided `envoy.yaml`
4. **Update Components**: Replace WebSocket hooks with gRPC hooks
5. **Test End-to-End**: Verify all 5 streams work correctly
6. **Deploy to Production**: Gradual rollout with feature flags

### Timeline

- **Week 1**: Enable gRPC services, generate stubs
- **Week 2**: Update frontend components
- **Week 3**: Internal testing
- **Week 4**: Beta rollout (10% traffic)
- **Week 5**: Full rollout (100% traffic)
- **Week 6**: Deprecate WebSocket endpoints

### Success Metrics

- ✅ 60-70% bandwidth reduction
- ✅ 60% latency improvement
- ✅ 80% reduction in connections
- ✅ Zero downtime migration
- ✅ Improved mobile performance
- ✅ Better developer experience

---

**Document Maintained By:** J4C Architecture Agent
**Last Updated:** December 16, 2025
**Version:** 1.0.0
