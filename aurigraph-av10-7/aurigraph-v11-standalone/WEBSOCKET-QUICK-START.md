# WebSocket Quick Start Guide - V12

## 1-Minute Quick Start

### Start the Server
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev
```

### Test WebSocket Connection (Browser Console)
```javascript
// Connect to transactions
const ws = new WebSocket('ws://localhost:9000/ws/transactions/legacy');
ws.onopen = () => console.log('✅ Connected!');
ws.onmessage = (event) => console.log('📨 Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('❌ Error:', error);
```

### Trigger Test Broadcast (New Terminal)
```bash
# Broadcast sample transaction
curl -X POST http://localhost:9000/api/v11/websocket/test/transaction

# Check status
curl http://localhost:9000/api/v11/websocket/test/status
```

## Available Endpoints

| Endpoint | Purpose | URL |
|----------|---------|-----|
| Transactions (Auth) | Real-time transactions with JWT | `ws://localhost:9000/ws/transactions` |
| Transactions (Legacy) | Real-time transactions, no auth | `ws://localhost:9000/ws/transactions/legacy` |
| Validators | Validator status updates | `ws://localhost:9000/ws/validators` |
| Metrics | Performance metrics | `ws://localhost:9000/ws/metrics` |
| Consensus | Consensus state | `ws://localhost:9000/ws/consensus` |
| Network | Network topology | `ws://localhost:9000/ws/network` |
| Channels | Channel updates | `ws://localhost:9000/ws/channels` |

## REST Test API

### Check Status
```bash
curl http://localhost:9000/api/v11/websocket/test/status | jq
```

### Broadcast Test Data
```bash
# Transaction
curl -X POST http://localhost:9000/api/v11/websocket/test/transaction

# Validator
curl -X POST http://localhost:9000/api/v11/websocket/test/validator

# Metrics
curl -X POST http://localhost:9000/api/v11/websocket/test/metrics

# All channels
curl -X POST http://localhost:9000/api/v11/websocket/test/all
```

### Custom Broadcast
```bash
# Custom transaction
curl -X POST http://localhost:9000/api/v11/websocket/test/transaction/custom \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0xABCD1234",
    "from": "0xAlice",
    "to": "0xBob",
    "value": "1000000",
    "status": "CONFIRMED",
    "gasUsed": 21000
  }'
```

## Frontend Integration

### React Example
```typescript
import { useEffect, useState } from 'react';

function TransactionMonitor() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9000/ws/transactions/legacy');

    ws.onmessage = (event) => {
      const tx = JSON.parse(event.data);
      setTransactions(prev => [tx, ...prev].slice(0, 10));
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <h2>Recent Transactions</h2>
      {transactions.map(tx => (
        <div key={tx.txHash}>
          {tx.txHash}: {tx.status}
        </div>
      ))}
    </div>
  );
}
```

### Vue Example
```vue
<template>
  <div>
    <h2>Metrics Dashboard</h2>
    <p>TPS: {{ metrics.tps }}</p>
    <p>CPU: {{ metrics.cpu }}%</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      metrics: { tps: 0, cpu: 0 }
    };
  },
  mounted() {
    const ws = new WebSocket('ws://localhost:9000/ws/metrics');
    ws.onmessage = (event) => {
      this.metrics = JSON.parse(event.data);
    };
  }
}
</script>
```

## Broadcasting from Backend

### Inject the Service
```java
@Inject
RealTimeUpdateService realTimeUpdateService;
```

### Broadcast Transaction
```java
realTimeUpdateService.broadcastTransaction(
    "0x1234567890abcdef",  // txHash
    "0xalice",              // from
    "0xbob",                // to
    "1000000000",           // value
    "CONFIRMED",            // status
    21000                   // gasUsed
);
```

### Broadcast Validator Status
```java
realTimeUpdateService.broadcastValidatorStatus(
    "0xvalidator123",  // validator
    "ACTIVE",          // status
    1000000,           // votingPower
    99.95,             // uptime
    12345              // lastBlockProposed
);
```

### Broadcast Metrics
```java
realTimeUpdateService.broadcastMetrics(
    1500000,  // tps
    45.2,     // cpu
    2048,     // memory (MB)
    256,      // connections
    0.001     // errorRate
);
```

## Message Formats

### Transaction Message
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "txHash": "0x1234567890abcdef",
  "from": "0xalice",
  "to": "0xbob",
  "value": "1000000000",
  "status": "CONFIRMED",
  "gasUsed": 21000
}
```

### Validator Message
```json
{
  "timestamp": "2025-12-16T10:30:00Z",
  "validator": "0xvalidator123",
  "status": "ACTIVE",
  "votingPower": 1000000,
  "uptime": 99.95,
  "lastBlockProposed": 12345
}
```

### Metrics Message
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

## Common Issues

### "Connection Refused"
```bash
# Check if Quarkus is running
lsof -i :9000

# If not, start it
./mvnw quarkus:dev
```

### "No messages received"
```bash
# Trigger a test broadcast
curl -X POST http://localhost:9000/api/v11/websocket/test/all

# Check WebSocket is open
ws.readyState === WebSocket.OPEN  // Should be true
```

### Enable Debug Logging
Add to `application.properties`:
```properties
quarkus.log.category."io.aurigraph.v11.websocket".level=DEBUG
```

## Files Reference

| File | Description |
|------|-------------|
| `WEBSOCKET-QUICK-START.md` | This file - Quick reference |
| `WEBSOCKET-IMPLEMENTATION-SUMMARY.md` | Executive summary |
| `WEBSOCKET-BACKEND-IMPLEMENTATION.md` | Comprehensive documentation |
| `src/main/java/io/aurigraph/v11/websocket/RealTimeUpdateService.java` | Broadcasting service |
| `src/main/java/io/aurigraph/v11/api/WebSocketTestResource.java` | Test REST API |

## Ready to Use

All WebSocket endpoints are:
- ✅ Implemented
- ✅ Enabled
- ✅ Compiled
- ✅ Documented
- ✅ Ready for frontend integration

**Start building your real-time features now!**

---

For detailed documentation, see:
- **WEBSOCKET-BACKEND-IMPLEMENTATION.md** (550+ lines)
- **WEBSOCKET-IMPLEMENTATION-SUMMARY.md** (executive summary)
