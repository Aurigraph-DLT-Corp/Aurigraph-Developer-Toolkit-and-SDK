# WebSocket Backend Implementation - V12

## Overview

The Aurigraph V12 platform provides comprehensive WebSocket support for real-time data streaming. This document describes the backend implementation of WebSocket endpoints and how to use them.

**Implementation Date**: December 2025
**Version**: V12.0.0
**Agent**: J4C Backend Agent

## Architecture

### WebSocket Endpoints

The following WebSocket endpoints are available:

| Endpoint | Purpose | Message Type | Status |
|----------|---------|--------------|--------|
| `/ws/transactions` | Real-time transaction updates (with auth) | TransactionMessage | Active |
| `/ws/transactions/legacy` | Legacy transaction stream (no auth) | TransactionMessage | Active |
| `/ws/validators` | Validator status changes | ValidatorMessage | Active |
| `/ws/metrics` | System performance metrics | MetricsMessage | Active |
| `/ws/consensus` | Consensus state updates | ConsensusMessage | Active |
| `/ws/network` | Network topology changes | NetworkMessage | Active |
| `/ws/channels` | Channel-specific updates | ChannelMessage | Active |

### Key Components

```
io.aurigraph.v11.websocket/
├── TransactionWebSocket.java          # Legacy transaction streaming
├── EnhancedTransactionWebSocket.java  # Authenticated transaction streaming
├── ValidatorWebSocket.java            # Validator status streaming
├── MetricsWebSocket.java              # Performance metrics streaming
├── ConsensusWebSocket.java            # Consensus state streaming
├── NetworkWebSocket.java              # Network topology streaming
├── ChannelWebSocket.java              # Channel updates streaming
├── RealTimeUpdateService.java         # Broadcasting service
└── dto/
    ├── TransactionMessage.java
    ├── ValidatorMessage.java
    ├── MetricsMessage.java
    ├── ConsensusMessage.java
    └── NetworkMessage.java
```

## WebSocket Endpoints Details

### 1. Transactions WebSocket

**Authenticated Endpoint**: `ws://localhost:9000/ws/transactions`

```javascript
// Connect with JWT token
const ws = new WebSocket('ws://localhost:9000/ws/transactions?token=YOUR_JWT_TOKEN');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Transaction:', data);
};

// Commands
ws.send('SUBSCRIBE transactions');
ws.send('UNSUBSCRIBE transactions');
ws.send('PING');
```

**Message Format**:
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "txHash": "0x1234567890abcdef...",
  "from": "0xabcdef1234567890",
  "to": "0x1234567890abcdef",
  "value": "1000000000000000000",
  "status": "CONFIRMED",
  "gasUsed": 21000
}
```

### 2. Validators WebSocket

**Endpoint**: `ws://localhost:9000/ws/validators`

```javascript
const ws = new WebSocket('ws://localhost:9000/ws/validators');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Validator:', data);
};
```

**Message Format**:
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "validator": "0xvalidator1234567890",
  "status": "ACTIVE",
  "votingPower": 1000000,
  "uptime": 99.95,
  "lastBlockProposed": 12345
}
```

### 3. Metrics WebSocket

**Endpoint**: `ws://localhost:9000/ws/metrics`

```javascript
const ws = new WebSocket('ws://localhost:9000/ws/metrics');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Metrics:', data);
};
```

**Message Format**:
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "tps": 1500000,
  "cpu": 45.2,
  "memory": 2048,
  "connections": 256,
  "errorRate": 0.001
}
```

### 4. Consensus WebSocket

**Endpoint**: `ws://localhost:9000/ws/consensus`

**Message Format**:
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "round": 12345,
  "step": "PROPOSE",
  "proposer": "0xvalidator123",
  "votes": 67,
  "status": "IN_PROGRESS"
}
```

### 5. Network WebSocket

**Endpoint**: `ws://localhost:9000/ws/network`

**Message Format**:
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "peerId": "peer-abc123",
  "event": "CONNECTED",
  "peerCount": 42,
  "latency": 15
}
```

## Broadcasting Service

### RealTimeUpdateService

The `RealTimeUpdateService` provides a centralized API for broadcasting updates:

```java
@Inject
RealTimeUpdateService realTimeUpdateService;

// Broadcast a transaction
realTimeUpdateService.broadcastTransaction(
    txHash,
    from,
    to,
    value,
    status,
    gasUsed
);

// Broadcast validator status
realTimeUpdateService.broadcastValidatorStatus(
    validator,
    status,
    votingPower,
    uptime,
    lastBlockProposed
);

// Broadcast metrics
realTimeUpdateService.broadcastMetrics(
    tps,
    cpu,
    memory,
    connections,
    errorRate
);

// Broadcast consensus update
realTimeUpdateService.broadcastConsensusUpdate(
    round,
    step,
    proposer,
    votes,
    status
);

// Broadcast network update
realTimeUpdateService.broadcastNetworkUpdate(
    peerId,
    event,
    peerCount,
    latency
);
```

## Testing REST API

### WebSocket Test Endpoints

The following REST endpoints are available for testing WebSocket broadcasts:

#### Broadcast Sample Transaction
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/transaction
```

#### Broadcast Custom Transaction
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/transaction/custom \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "from": "0xabcdef1234567890",
    "to": "0x1234567890abcdef",
    "value": "1000000000000000000",
    "status": "CONFIRMED",
    "gasUsed": 21000
  }'
```

#### Broadcast Sample Validator
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/validator
```

#### Broadcast Custom Validator
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/validator/custom \
  -H "Content-Type: application/json" \
  -d '{
    "validator": "0xvalidator1234567890",
    "status": "ACTIVE",
    "votingPower": 1000000,
    "uptime": 99.95,
    "lastBlockProposed": 12345
  }'
```

#### Broadcast Sample Metrics
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/metrics
```

#### Broadcast Custom Metrics
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/metrics/custom \
  -H "Content-Type: application/json" \
  -d '{
    "tps": 1500000,
    "cpu": 45.5,
    "memory": 2048,
    "connections": 256,
    "errorRate": 0.001
  }'
```

#### Get WebSocket Status
```bash
curl http://localhost:9000/api/v11/websocket/test/status
```

**Response**:
```json
{
  "status": "active",
  "totalConnections": 3,
  "hasActiveConnections": true,
  "endpoints": {
    "transactions": "/ws/transactions",
    "validators": "/ws/validators",
    "metrics": "/ws/metrics",
    "consensus": "/ws/consensus",
    "network": "/ws/network",
    "channels": "/ws/channels"
  },
  "message": "3 WebSocket client(s) connected"
}
```

#### Broadcast to All Channels
```bash
curl -X POST http://localhost:9000/api/v11/websocket/test/all
```

## Integration with Frontend

### Frontend WebSocket Service

The frontend should use the WebSocket service located at:
```
enterprise-portal/frontend/src/services/websocketService.ts
```

### Example Frontend Integration

```typescript
import { websocketService } from './services/websocketService';

// Connect to transactions stream
websocketService.connect('transactions', (message) => {
  console.log('New transaction:', message);
});

// Connect to validators stream
websocketService.connect('validators', (message) => {
  console.log('Validator update:', message);
});

// Connect to metrics stream
websocketService.connect('metrics', (message) => {
  console.log('Metrics update:', message);
});
```

## Configuration

### application.properties

WebSocket configuration is managed in `src/main/resources/application.properties`:

```properties
# HTTP Configuration
quarkus.http.port=9000
quarkus.http.host=0.0.0.0

# HTTP/2 Configuration (enhances WebSocket performance)
quarkus.http.http2=true
quarkus.http.limits.max-concurrent-streams=100000
```

### Dependencies

The following dependency is required in `pom.xml`:

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-websockets</artifactId>
</dependency>
```

## Performance Considerations

1. **Connection Pooling**: Each WebSocket endpoint uses ConcurrentHashMap.newKeySet() for efficient session management
2. **Async Broadcasting**: All broadcasts use `session.getAsyncRemote().sendText()` for non-blocking I/O
3. **JSON Serialization**: Jackson ObjectMapper is used for efficient JSON serialization
4. **Heartbeat Mechanism**: The enhanced transaction WebSocket includes heartbeat for connection health monitoring

## Security

1. **Authentication**: The `/ws/transactions` endpoint uses JWT authentication via `AuthenticatedWebSocketConfigurator`
2. **Session Management**: `WebSocketSessionManager` tracks authenticated sessions
3. **Authorization**: `WebSocketAuthService` handles session validation and timeout
4. **Device Fingerprinting**: Security tracking via IP and User-Agent

## Error Handling

All WebSocket endpoints include:
- `@OnError` handlers for graceful error recovery
- Automatic session cleanup on errors
- Comprehensive logging with JBoss Logger

## Connection Management

### Session Lifecycle

1. **OnOpen**: Session registered, welcome message sent
2. **OnMessage**: Command processing (SUBSCRIBE, UNSUBSCRIBE, PING)
3. **OnClose**: Session cleanup, subscriptions removed
4. **OnError**: Error logging, session removal

### Heartbeat (Enhanced Endpoint)

- Interval: 30 seconds
- Timeout: 60 seconds (2x interval)
- Automatic connection close on timeout

## Monitoring

### Connection Statistics

```java
// Get total connections across all endpoints
int total = realTimeUpdateService.getTotalConnections();

// Check if any clients are connected
boolean hasConnections = realTimeUpdateService.hasActiveConnections();
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure Quarkus is running on port 9000
   - Check firewall settings

2. **Authentication Failed** (`/ws/transactions`)
   - Verify JWT token is valid
   - Check token expiration

3. **No Messages Received**
   - Verify you're subscribed to the correct channel
   - Check that broadcasts are being triggered
   - Use the test REST API to trigger sample broadcasts

### Debug Logging

Enable debug logging in `application.properties`:

```properties
quarkus.log.category."io.aurigraph.v11.websocket".level=DEBUG
```

## Testing Workflow

1. **Start Quarkus**:
   ```bash
   cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
   ./mvnw quarkus:dev
   ```

2. **Connect WebSocket Client** (JavaScript):
   ```javascript
   const ws = new WebSocket('ws://localhost:9000/ws/transactions/legacy');
   ws.onmessage = (event) => console.log(event.data);
   ```

3. **Trigger Broadcast**:
   ```bash
   curl -X POST http://localhost:9000/api/v11/websocket/test/transaction
   ```

4. **Verify Message Received** in browser console

## File Structure Summary

### New Files Created

1. `/src/main/java/io/aurigraph/v11/websocket/RealTimeUpdateService.java`
   - Centralized broadcasting service
   - 283 lines

2. `/src/main/java/io/aurigraph/v11/api/WebSocketTestResource.java`
   - REST API for testing WebSocket functionality
   - 276 lines

### Modified Files

1. `/src/main/java/io/aurigraph/v11/websocket/TransactionWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/transactions/legacy")

2. `/src/main/java/io/aurigraph/v11/websocket/EnhancedTransactionWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/transactions")

3. `/src/main/java/io/aurigraph/v11/websocket/ValidatorWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/validators")

4. `/src/main/java/io/aurigraph/v11/websocket/MetricsWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/metrics")

5. `/src/main/java/io/aurigraph/v11/websocket/ConsensusWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/consensus")

6. `/src/main/java/io/aurigraph/v11/websocket/NetworkWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/network")

7. `/src/main/java/io/aurigraph/v11/websocket/ChannelWebSocket.java`
   - Re-enabled @ServerEndpoint("/ws/channels")

## Next Steps

1. ✅ WebSocket endpoints implemented and enabled
2. ✅ Broadcasting service created
3. ✅ REST API for testing created
4. 🔄 Frontend integration (in progress)
5. 📋 End-to-end testing
6. 📋 Production deployment

## Support

For issues or questions:
- Check logs: `./mvnw quarkus:dev` output
- Test REST API: `curl http://localhost:9000/api/v11/websocket/test/status`
- Review this documentation

---

**Document Version**: V12.0.0
**Last Updated**: December 16, 2025
**Author**: J4C Backend Agent
