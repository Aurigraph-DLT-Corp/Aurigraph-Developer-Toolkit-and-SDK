# WebSocket Implementation Guide

## Overview

This document provides comprehensive guidance for using the Aurigraph V11 WebSocket endpoints for real-time asset, registry, and compliance updates.

## WebSocket Endpoints

### 1. Asset Traceability WebSocket
**Endpoint**: `ws://localhost:9003/ws/assets/traceability/{traceId}`

Subscribe to real-time updates for a specific asset trace.

**Events Broadcast**:
- `CREATED` - New asset trace created
- `TRANSFERRED` - Ownership transferred
- `VERIFIED` - Asset verification completed
- `STATUS_CHANGED` - Compliance status changed
- `AUDIT_ADDED` - New audit entry added

**Connection Example (JavaScript)**:
```javascript
const traceId = "trace_abc123";
const ws = new WebSocket(`ws://localhost:9003/ws/assets/traceability/${traceId}`);

ws.onopen = () => {
  console.log('Connected to asset traceability updates');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Asset update received:', message);

  if (message.action === 'TRANSFERRED') {
    console.log(`Asset transferred from ${message.details.fromOwner} to ${message.details.toOwner}`);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Connection closed');
};
```

**Message Format**:
```json
{
  "messageId": "msg_uuid",
  "traceId": "trace_abc123",
  "assetId": "asset_xyz789",
  "action": "TRANSFERRED",
  "timestamp": "2025-11-14T10:30:00Z",
  "assetType": "RealEstate",
  "currentOwner": "user_456",
  "valuation": 500000.00,
  "complianceStatus": "VERIFIED",
  "details": {
    "fromOwner": "user_123",
    "toOwner": "user_456",
    "percentage": 100.0,
    "txHash": "0x..."
  }
}
```

### 2. Registry WebSocket
**Endpoint**: `ws://localhost:9003/ws/registries/{registryType}`

Subscribe to real-time updates for specific registry types.

**Registry Types**:
- `smart_contract` - Smart contract registry
- `token` - Token registry (ERC20, ERC721, ERC1155)
- `rwa` - Real-world asset registry
- `merkle_tree` - Merkle tree registry
- `compliance` - Compliance registry

**Events Broadcast**:
- `REGISTERED` - New entry registered
- `STATUS_CHANGED` - Entry status changed
- `VERIFIED` - Entry verified
- `UPDATED` - Entry updated
- `DELETED` - Entry deleted

**Connection Example (JavaScript)**:
```javascript
const registryType = "rwa";
const ws = new WebSocket(`ws://localhost:9003/ws/registries/${registryType}`);

ws.onopen = () => {
  console.log(`Connected to ${registryType} registry updates`);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Registry update received:', message);

  if (message.action === 'REGISTERED') {
    console.log(`New ${registryType} registered: ${message.name}`);
  }
};
```

**Message Format**:
```json
{
  "messageId": "msg_uuid",
  "registryType": "rwa",
  "entryId": "rwat_123",
  "action": "REGISTERED",
  "timestamp": "2025-11-14T10:30:00Z",
  "status": "ACTIVE",
  "name": "Commercial Property ABC",
  "verificationStatus": "PENDING_VERIFICATION",
  "details": {
    "registeredBy": "admin_user",
    "category": "real_estate"
  }
}
```

### 3. Compliance Alerts WebSocket
**Endpoint**: `ws://localhost:9003/ws/compliance/alerts`

Subscribe to real-time compliance alerts and notifications.

**Alert Severities**:
- `INFO` - Informational alerts
- `WARNING` - Warning alerts (renewal window)
- `CRITICAL` - Critical alerts (expired, revoked)

**Events Broadcast**:
- `EXPIRING` - Certification expiring soon
- `EXPIRED` - Certification expired
- `ISSUED` - New certification issued
- `RENEWED` - Certification renewed
- `REVOKED` - Certification revoked
- `VERIFICATION_FAILED` - Verification failed

**Connection Example (JavaScript)**:
```javascript
const ws = new WebSocket('ws://localhost:9003/ws/compliance/alerts');

ws.onopen = () => {
  console.log('Connected to compliance alerts');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Compliance alert received:', message);

  if (message.severity === 'CRITICAL') {
    console.error(`CRITICAL ALERT: ${message.message}`);
    showNotification(message);
  }
};
```

**Message Format**:
```json
{
  "messageId": "msg_uuid",
  "entityId": "entity_abc",
  "certificationId": "cert_123",
  "severity": "WARNING",
  "action": "EXPIRING",
  "timestamp": "2025-11-14T10:30:00Z",
  "certificationType": "ISO27001",
  "complianceLevel": "LEVEL_3",
  "message": "Certification expiring in 30 days",
  "expiryDate": "2025-12-14T00:00:00Z",
  "details": {
    "daysUntilExpiry": 30,
    "renewalRequired": true
  }
}
```

## Client Commands

All WebSocket endpoints support the following commands:

### PING
Health check command to verify connection.

**Request**:
```json
{
  "command": "PING"
}
```

**Response**:
```json
{
  "type": "pong",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### SUBSCRIBE
Manually subscribe to updates (auto-subscribed on connection).

**Request**:
```json
{
  "command": "SUBSCRIBE"
}
```

**Response**:
```json
{
  "type": "ack",
  "message": "Subscribed to updates",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### UNSUBSCRIBE
Unsubscribe from updates.

**Request**:
```json
{
  "command": "UNSUBSCRIBE"
}
```

**Response**:
```json
{
  "type": "ack",
  "message": "Unsubscribed from updates",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### GET_STATUS
Get current subscription status and statistics.

**Request**:
```json
{
  "command": "GET_STATUS"
}
```

**Response**:
```json
{
  "type": "status",
  "subscribed": true,
  "sessionId": "session_123",
  "subscriberCount": 5,
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## React/TypeScript Example

```typescript
import { useEffect, useState, useCallback } from 'react';

interface AssetUpdate {
  messageId: string;
  traceId: string;
  assetId: string;
  action: 'CREATED' | 'TRANSFERRED' | 'VERIFIED' | 'STATUS_CHANGED';
  timestamp: string;
  assetType: string;
  currentOwner: string;
  valuation: number;
  complianceStatus: string;
  details?: Record<string, any>;
}

export const useAssetTraceability = (traceId: string) => {
  const [updates, setUpdates] = useState<AssetUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(
      `ws://localhost:9003/ws/assets/traceability/${traceId}`
    );

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Filter out system messages
      if (message.action) {
        setUpdates((prev) => [message, ...prev].slice(0, 100)); // Keep last 100
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [traceId]);

  const sendCommand = useCallback((command: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ command }));
    }
  }, [ws]);

  return { updates, connected, sendCommand };
};

// Usage in component
const AssetTracker = ({ traceId }: { traceId: string }) => {
  const { updates, connected, sendCommand } = useAssetTraceability(traceId);

  return (
    <div>
      <h2>Asset Traceability - {connected ? 'Connected' : 'Disconnected'}</h2>
      <button onClick={() => sendCommand('PING')}>Ping</button>
      <button onClick={() => sendCommand('GET_STATUS')}>Get Status</button>

      <div>
        {updates.map((update) => (
          <div key={update.messageId}>
            <strong>{update.action}</strong> - {update.timestamp}
            <pre>{JSON.stringify(update, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Python Example

```python
import asyncio
import websockets
import json

async def asset_traceability_client(trace_id: str):
    uri = f"ws://localhost:9003/ws/assets/traceability/{trace_id}"

    async with websockets.connect(uri) as websocket:
        print(f"Connected to asset traceability for {trace_id}")

        # Send PING command
        await websocket.send(json.dumps({"command": "PING"}))

        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

            if 'action' in data:
                print(f"Asset update: {data['action']} - {data.get('assetType', 'Unknown')}")

# Run the client
asyncio.run(asset_traceability_client("trace_abc123"))
```

## Testing with wscat

Install wscat:
```bash
npm install -g wscat
```

Test asset traceability:
```bash
wscat -c ws://localhost:9003/ws/assets/traceability/trace_abc123
```

Test registry updates:
```bash
wscat -c ws://localhost:9003/ws/registries/rwa
```

Test compliance alerts:
```bash
wscat -c ws://localhost:9003/ws/compliance/alerts
```

Send commands:
```
> {"command":"PING"}
< {"type":"pong","timestamp":"2025-11-14T10:30:00Z"}

> {"command":"GET_STATUS"}
< {"type":"status","subscribed":true,"sessionId":"...","subscriberCount":1,"timestamp":"..."}
```

## Security Considerations

1. **Authentication**: Currently, WebSocket endpoints are unauthenticated. In production, implement JWT token-based authentication.

2. **Rate Limiting**: Implement rate limiting to prevent abuse.

3. **TLS/WSS**: Use secure WebSocket (wss://) in production:
   ```javascript
   const ws = new WebSocket('wss://dlt.aurigraph.io/ws/assets/traceability/trace_123');
   ```

4. **Message Validation**: Always validate incoming messages on the client side.

5. **Error Handling**: Implement reconnection logic with exponential backoff.

## Performance Considerations

- **Session Management**: The service uses ConcurrentHashMap for thread-safe session management.
- **Dead Session Cleanup**: Automatic cleanup of dead sessions during broadcast.
- **Message Statistics**: Monitor via `/api/v11/websocket/stats` (if implemented).
- **Scalability**: For production, consider using a message broker (Redis Pub/Sub, Kafka) for horizontal scaling.

## Monitoring

Get WebSocket statistics from the service (if stats endpoint is exposed):
```bash
curl http://localhost:9003/api/v11/websocket/stats
```

Expected response:
```json
{
  "totalSessions": 15,
  "assetSubscriptions": 8,
  "registrySubscriptions": 5,
  "complianceSubscriptions": 2,
  "messagesSent": 1247,
  "messagesFailedToSend": 3,
  "deadSessionsRemoved": 2,
  "assetSubscriptionsByTraceId": {
    "trace_abc123": 3,
    "trace_xyz789": 5
  },
  "registrySubscriptionsByType": {
    "rwa": 3,
    "token": 2
  }
}
```

## Troubleshooting

### Connection Refused
- Ensure Quarkus application is running on port 9003
- Check firewall settings
- Verify WebSocket endpoint path

### No Messages Received
- Verify subscription is active (send GET_STATUS command)
- Check that events are being triggered in the system
- Monitor application logs for broadcast errors

### Connection Drops
- Implement ping/pong heartbeat mechanism
- Use reconnection logic with exponential backoff
- Check network stability

### Message Parsing Errors
- Verify JSON format
- Check for required fields in commands
- Review application logs for error details

## Future Enhancements

1. **Authentication & Authorization**: JWT-based auth with role-based subscriptions
2. **Message Filtering**: Client-side filtering options
3. **Replay Functionality**: Replay missed messages
4. **Compression**: Message compression for large payloads
5. **Binary Protocols**: Consider Protocol Buffers for efficiency
6. **Clustering**: Redis-based session sharing for multi-instance deployments

## Support

For issues or questions, contact the Aurigraph V11 Development Team or file an issue in the project repository.
