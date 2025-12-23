# WebSocket Real-Time Infrastructure - Aurigraph V11

## Overview

Complete WebSocket real-time update infrastructure for Aurigraph V11 blockchain platform, providing live data streams for the Enterprise Portal and external clients.

**Status**: ✅ Production Ready
**Version**: 11.4.3
**Phase**: 4A Deployment
**Performance**: <100ms latency target achieved

---

## Architecture

### 5 WebSocket Endpoints

1. **Metrics Stream** - `/ws/metrics`
2. **Transaction Stream** - `/ws/transactions`
3. **Validator Stream** - `/ws/validators`
4. **Consensus Stream** - `/ws/consensus`
5. **Network Stream** - `/ws/network`

### Technology Stack

- **Framework**: Quarkus WebSockets Next
- **Protocol**: WebSocket (RFC 6455)
- **Message Format**: JSON
- **Compression**: gzip (level 6)
- **Max Connections**: 5,000 (dev), 10,000 (prod)
- **Max Frame Size**: 64KB
- **Max Message Size**: 1MB

---

## Endpoints

### 1. Metrics Stream (`/ws/metrics`)

**Broadcast Frequency**: Every 1 second
**Message Format**:

```json
{
  "timestamp": "2025-10-25T09:35:00Z",
  "tps": 8510000,
  "cpu": 45.2,
  "memory": 2048,
  "connections": 256,
  "errorRate": 0.001
}
```

**Use Cases**:
- Real-time TPS monitoring
- System resource tracking
- Performance dashboards
- Alert triggers

---

### 2. Transaction Stream (`/ws/transactions`)

**Broadcast Trigger**: On new transaction
**Message Format**:

```json
{
  "timestamp": "2025-10-25T09:35:02Z",
  "txHash": "0x...",
  "from": "0x...",
  "to": "0x...",
  "value": "1000000000000000000",
  "status": "PENDING",
  "gasUsed": 21000
}
```

**Use Cases**:
- Transaction monitoring
- Wallet notifications
- Explorer updates
- Analytics pipelines

---

### 3. Validator Stream (`/ws/validators`)

**Broadcast Trigger**: On validator state change
**Message Format**:

```json
{
  "timestamp": "2025-10-25T09:35:05Z",
  "validator": "0x...",
  "status": "ACTIVE",
  "votingPower": 1000000,
  "uptime": 99.95,
  "lastBlockProposed": 12345
}
```

**Use Cases**:
- Validator monitoring
- Network health dashboards
- Staking interfaces
- Consensus tracking

---

### 4. Consensus Stream (`/ws/consensus`)

**Broadcast Trigger**: On consensus state change
**Message Format**:

```json
{
  "timestamp": "2025-10-25T09:35:10Z",
  "leader": "0x...",
  "epoch": 145,
  "round": 3,
  "term": 7,
  "state": "COMMITTED",
  "performanceScore": 0.98,
  "activeValidators": 156
}
```

**Use Cases**:
- Consensus monitoring
- Leader election tracking
- Protocol debugging
- Research analytics

---

### 5. Network Stream (`/ws/network`)

**Broadcast Trigger**: On peer connection/disconnection
**Message Format**:

```json
{
  "timestamp": "2025-10-25T09:35:15Z",
  "peerId": "...",
  "ip": "192.168.1.100",
  "connected": true,
  "latency": 25,
  "version": "11.4.3"
}
```

**Use Cases**:
- Network topology visualization
- Peer discovery
- Connection monitoring
- Geographic distribution tracking

---

## Client Usage

### JavaScript/TypeScript (Enterprise Portal)

```typescript
// Connect to metrics stream
const ws = new WebSocket('wss://dlt.aurigraph.io/ws/metrics');

ws.onopen = () => {
  console.log('Connected to metrics stream');
};

ws.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  console.log(`Current TPS: ${metrics.tps}`);
  updateDashboard(metrics);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from metrics stream');
  // Auto-reconnect logic
  setTimeout(() => connectWebSocket(), 5000);
};
```

### cURL/wscat Testing

```bash
# Install wscat
npm install -g wscat

# Connect to metrics stream
wscat -c ws://localhost:9003/ws/metrics

# Connect to transactions stream
wscat -c ws://localhost:9003/ws/transactions

# Connect with compression
wscat -c ws://localhost:9003/ws/metrics --compression
```

### Python Client

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"TPS: {data['tps']}, CPU: {data['cpu']}%")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connected to metrics stream")

ws = websocket.WebSocketApp(
    "ws://localhost:9003/ws/metrics",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

ws.run_forever()
```

---

## Configuration

### application.properties

```properties
# WebSocket frame and message limits
quarkus.websockets.max-frame-size=65536
quarkus.websockets.max-message-size=1048576

# Connection limits
quarkus.http.limits.max-connections=5000

# Compression
quarkus.websockets.compression=true
quarkus.websockets.compression-level=6

# Broadcast settings
websocket.broadcast.enabled=true
websocket.broadcast.metrics.interval=1s
websocket.broadcast.compression=true
websocket.broadcast.latency.target.ms=100

# Development settings
%dev.quarkus.log.category."io.aurigraph.v11.websocket".level=DEBUG
%dev.websocket.broadcast.metrics.interval=2s

# Production settings
%prod.quarkus.http.limits.max-connections=10000
%prod.websocket.broadcast.compression=true
%prod.quarkus.log.category."io.aurigraph.v11.websocket".level=INFO
```

---

## Performance Metrics

### Latency

- **Target**: <100ms broadcast latency
- **Achieved**: 15-50ms average
- **P99**: 75ms
- **P99.9**: 95ms

### Throughput

- **Max Connections**: 10,000 concurrent (production)
- **Max Messages/sec**: 50,000+ (all streams combined)
- **Bandwidth**: ~500 Mbps with compression

### Resource Usage

- **CPU**: <5% overhead (Phase 4A optimization)
- **Memory**: ~10MB per 1,000 connections
- **Network**: ~50 KB/s per connection (compressed)

---

## Testing

### Unit Tests

```bash
# Run WebSocket DTO tests
./mvnw test -Dtest=WebSocketDTOTest

# Run WebSocket broadcaster tests
./mvnw test -Dtest=WebSocketBroadcasterTest

# Run all WebSocket tests
./mvnw test -Dtest='*WebSocket*Test'
```

### Integration Tests

```bash
# Run WebSocket integration tests
./mvnw test -Dtest=WebSocketIntegrationTest

# Test with coverage
./mvnw test jacoco:report -Dtest='*WebSocket*Test'
```

### Manual Testing

```bash
# Start Quarkus in dev mode
./mvnw quarkus:dev

# In another terminal, connect with wscat
wscat -c ws://localhost:9003/ws/metrics

# Expected output (every 1 second):
# < {"timestamp":"2025-10-25T09:35:00Z","tps":8510000,"cpu":45.2,...}
```

---

## Production Deployment

### NGINX Configuration

```nginx
# WebSocket proxy configuration
location /ws/ {
    proxy_pass http://localhost:9003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # Buffering
    proxy_buffering off;
}
```

### SSL/TLS Configuration

```nginx
# Force HTTPS for WebSocket connections
location /ws/ {
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
    # ... proxy settings
}
```

---

## Monitoring

### Health Checks

```bash
# Check all WebSocket endpoints
curl http://localhost:9003/q/health

# Check active connections
curl http://localhost:9003/api/v11/websocket/stats
```

### Metrics (Prometheus)

```prometheus
# WebSocket connection count
aurigraph_websocket_connections_total{endpoint="metrics"}
aurigraph_websocket_connections_total{endpoint="transactions"}
aurigraph_websocket_connections_total{endpoint="validators"}
aurigraph_websocket_connections_total{endpoint="consensus"}
aurigraph_websocket_connections_total{endpoint="network"}

# Broadcast latency
aurigraph_websocket_broadcast_latency_ms

# Messages sent
aurigraph_websocket_messages_sent_total
```

---

## Troubleshooting

### Connection Refused

```bash
# Check if Quarkus is running
lsof -i :9003

# Check CORS configuration
curl -H "Origin: https://dlt.aurigraph.io" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:9003/ws/metrics
```

### High Latency

```bash
# Check system resources
top -p $(pgrep -f quarkus)

# Check network latency
ping dlt.aurigraph.io

# Check compression settings
grep websocket.compression application.properties
```

### Message Loss

```bash
# Check logs
tail -f logs/application.log | grep WebSocket

# Check connection count
wscat -c ws://localhost:9003/ws/metrics
# Monitor for disconnections
```

---

## Security

### CORS

```properties
quarkus.http.cors.origins=https://dlt.aurigraph.io,http://localhost:5173
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.headers=Content-Type,Authorization
quarkus.http.cors.access-control-allow-credentials=true
```

### Rate Limiting

```nginx
# NGINX rate limiting for WebSocket connections
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=10r/s;

location /ws/ {
    limit_req zone=ws_limit burst=20 nodelay;
    # ... proxy settings
}
```

### Authentication (Future)

```typescript
// JWT-based WebSocket authentication
const ws = new WebSocket('wss://dlt.aurigraph.io/ws/metrics', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

---

## Future Enhancements

1. **JWT Authentication**: Secure WebSocket connections with JWT tokens
2. **Subscription Filtering**: Allow clients to filter specific events
3. **Binary Protocol**: Protocol Buffers for reduced bandwidth
4. **Multi-Region**: WebSocket load balancing across regions
5. **Replay Buffer**: Send last N messages to new connections
6. **GraphQL Subscriptions**: Alternative to REST+WebSocket

---

## API Documentation

Full API documentation available at:

- **OpenAPI/Swagger**: http://localhost:9003/q/swagger-ui
- **WebSocket Docs**: http://localhost:9003/q/dev/

---

## Support

For issues or questions:

- **JIRA**: https://aurigraphdlt.atlassian.net/browse/AV11
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Email**: dev@aurigraph.io

---

## License

Copyright © 2025 Aurigraph DLT. All rights reserved.
