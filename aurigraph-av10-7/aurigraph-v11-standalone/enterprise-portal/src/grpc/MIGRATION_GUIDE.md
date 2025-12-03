# WebSocket to gRPC-Web Migration Guide

## Overview

This guide documents the migration from WebSocket streaming to gRPC-Web streaming in the Aurigraph Enterprise Portal. The migration provides significant performance improvements and better reliability.

## Migration Timeline

- **Start Date**: December 2024
- **Deprecation Date**: March 1, 2025
- **Removal Date**: June 1, 2025

## Benefits of gRPC-Web

| Feature | WebSocket | gRPC-Web |
|---------|-----------|----------|
| Bandwidth | JSON (verbose) | Protobuf (60-70% smaller) |
| Connections | Multiple per stream | HTTP/2 multiplexing (single) |
| Type Safety | Runtime validation | Compile-time types |
| Flow Control | Manual | Built-in backpressure |
| Reconnection | Custom logic | Automatic with exponential backoff |

## Hook Migration Reference

### Metrics Streaming

**Before (WebSocket):**
```typescript
import { useMetricsWebSocket } from '../hooks/useMetricsWebSocket'

const { metrics, status, reconnect } = useMetricsWebSocket()
```

**After (gRPC-Web):**
```typescript
import { useMetricsGrpc } from '../grpc'

const { metrics, status, reconnect, isConnected, metricsHistory } = useMetricsGrpc({
  updateIntervalMs: 1000,  // Optional: defaults to 1000
  enabled: true             // Optional: defaults to true
})
```

### Consensus Streaming

**Before (WebSocket):**
```typescript
import { useConsensusStream } from '../hooks/useConsensusStream'

const { consensusState, recentEvents, status } = useConsensusStream()
```

**After (gRPC-Web):**
```typescript
import { useConsensusGrpc } from '../grpc'

const {
  consensusState,
  recentEvents,
  status,
  reconnect,
  clearEvents,
  isConnected
} = useConsensusGrpc({
  updateIntervalMs: 500,
  eventTypes: ['state_changes', 'leader_election', 'proposals'],
  includeHistorical: false
})
```

### Validator Streaming

**Before (WebSocket):**
```typescript
import { useValidatorStream } from '../hooks/useValidatorStream'

const { validators, status } = useValidatorStream()
```

**After (gRPC-Web):**
```typescript
import { useValidatorGrpc } from '../grpc'

const {
  validators,
  validatorsMap,
  recentUpdates,
  activeCount,
  inactiveCount,
  totalCount,
  status,
  reconnect,
  isConnected
} = useValidatorGrpc({
  updateIntervalMs: 2000,
  validatorIds: [],  // Empty = all validators
  includePerformanceMetrics: true,
  includeHealthMetrics: true
})
```

### Network Streaming

**Before (WebSocket):**
```typescript
import { useNetworkStream } from '../hooks/useNetworkStream'

const { peers, networkMetrics, status } = useNetworkStream()
```

**After (gRPC-Web):**
```typescript
import { useNetworkGrpc } from '../grpc'

const {
  peers,
  peersMap,
  connectedPeers,
  disconnectedPeers,
  metrics,
  recentEvents,
  status,
  reconnect,
  clearEvents,
  isConnected
} = useNetworkGrpc({
  updateIntervalMs: 3000,
  filterPeerIds: [],
  includeTopology: true
})
```

### Transaction Streaming

**Before (WebSocket):**
```typescript
import { useTransactionStream } from '../hooks/useTransactionStream'

const { transactions, status, clearTransactions } = useTransactionStream()
```

**After (gRPC-Web):**
```typescript
import { useTransactionGrpc } from '../grpc'

const {
  transactions,
  pendingTransactions,
  successfulTransactions,
  failedTransactions,
  newTransactions,
  statistics,
  recentAlerts,
  status,
  reconnect,
  clearTransactions,
  clearAlerts,
  isConnected,
  transactionCount
} = useTransactionGrpc({
  updateIntervalMs: 1000,
  filterStatuses: [],  // Empty = all statuses
  filterAddresses: [],
  maxTransactions: 100,
  newBadgeTimeoutMs: 5000
})
```

## Protocol Switching (Feature Flags)

The `StreamingConfig` module allows switching between protocols at runtime:

```typescript
import { streamingConfig } from '../grpc/StreamingConfig'

// Get current configuration
const config = streamingConfig.getConfig()

// Check if gRPC-Web should be used for an endpoint
const useGrpc = streamingConfig.shouldUseGrpcWeb('metrics')

// Switch protocol for a specific endpoint
streamingConfig.setEndpointProtocol('metrics', 'websocket')  // Fallback
streamingConfig.setEndpointProtocol('metrics', 'grpc-web')   // Use gRPC

// Enable debug mode
streamingConfig.setDebug(true)

// Get diagnostics
console.log(streamingConfig.getDiagnostics())
```

## Using the StreamingStatusPanel

Add the `StreamingStatusPanel` component to monitor all stream connections:

```typescript
import StreamingStatusPanel from '../components/StreamingStatusPanel'

function MyDashboard() {
  return (
    <div>
      <StreamingStatusPanel
        expanded={false}       // Start collapsed
        showControls={true}    // Show protocol toggle buttons
        compact={false}        // Full view (set true for minimal view)
      />
      {/* Your dashboard content */}
    </div>
  )
}
```

## Environment Configuration

The gRPC-Web client automatically configures URLs based on environment:

### Development (localhost)
```env
VITE_GRPC_WEB_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:9003
```

### Production (dlt.aurigraph.io)
```env
VITE_GRPC_WEB_SECURE_URL=https://dlt.aurigraph.io/grpc-web
VITE_WSS_URL=wss://dlt.aurigraph.io
```

## Envoy Proxy Setup

gRPC-Web requires an Envoy proxy for browser compatibility:

```bash
# Start Envoy proxy locally
./scripts/start-grpc-web-proxy.sh local

# Start with Docker
./scripts/start-grpc-web-proxy.sh docker

# Production uses nginx routing to Envoy
# See: deployment/nginx-aurigraph-v11.conf
```

## Common Migration Issues

### 1. Type Mismatches

**Problem:** Field names differ between WebSocket JSON and Protobuf.

**Solution:** Use the type definitions in `src/grpc/types.ts` which map Protobuf fields.

### 2. Timestamp Handling

**Problem:** WebSocket uses Unix milliseconds, Protobuf uses `{seconds, nanos}`.

**Solution:** Use the `timestampToUnixMs()` helper:

```typescript
import { timestampToUnixMs } from '../grpc/types'

const unixMs = timestampToUnixMs(protoTimestamp)
```

### 3. Connection Not Establishing

**Problem:** gRPC-Web connection fails silently.

**Checklist:**
1. Verify Envoy proxy is running (`curl http://localhost:8080/healthz`)
2. Check CORS headers are configured
3. Verify gRPC server is running on port 9001
4. Enable debug mode: `streamingConfig.setDebug(true)`

### 4. Fallback to WebSocket

If gRPC-Web has issues, you can fallback:

```typescript
// Per-endpoint fallback
streamingConfig.setEndpointProtocol('metrics', 'websocket')

// Or disable an endpoint entirely
const config = streamingConfig.getConfig()
config.endpoints.metrics.enabled = false
```

## Testing the Migration

1. **Open the Real-Time Streaming Dashboard:**
   Navigate to `/dashboards/streaming` to see all streams in action.

2. **Check Connection Status:**
   The `StreamingStatusPanel` shows connection status for all endpoints.

3. **Toggle Protocols:**
   Use the "Switch to WS/gRPC" buttons to test fallback behavior.

4. **Enable Debug Mode:**
   Toggle the debug switch to see detailed diagnostics.

## Support

- **JIRA Tickets:** AV11-554 (Epic), AV11-559, AV11-560, AV11-561
- **Sunset Date:** March 1, 2025
- **Questions:** Contact the Platform Team

## Checklist for Component Migration

- [ ] Replace WebSocket hook import with gRPC hook
- [ ] Update destructured return values (may have new fields)
- [ ] Handle new features (metricsHistory, recentEvents, etc.)
- [ ] Test with both protocols using feature flags
- [ ] Remove old WebSocket hook imports after verification
- [ ] Update component tests
