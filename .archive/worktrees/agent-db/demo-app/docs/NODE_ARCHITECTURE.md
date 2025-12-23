# Aurigraph Demo App - Node Architecture Design

**Epic**: AV11-192 - Real-Time Scalable Node Visualization Demo Application  
**Task**: AV11-193 - Design Node Architecture and Configuration System  
**Date**: October 4, 2025

## 1. Node Types Overview

### 1.1 Channel Nodes
**Purpose**: Message routing and network communication  
**Responsibilities**:
- Message queue management
- Load balancing across validators
- Routing logic and path optimization
- Real-time status broadcasting

**State Model**:
```
IDLE → CONNECTED → ROUTING → OVERLOAD → DISCONNECTED
```

### 1.2 Validator Nodes
**Purpose**: Consensus participation and block validation  
**Responsibilities**:
- HyperRAFT++ consensus participation
- Leader election
- Vote casting and tracking
- Block validation and finalization

**State Model**:
```
FOLLOWER → CANDIDATE → LEADER
         ↓            ↓
      VOTING ←→ VALIDATING → FINALIZING
```

### 1.3 Business Nodes
**Purpose**: Transaction processing and business logic execution  
**Responsibilities**:
- Transaction validation
- Smart contract execution
- Business logic processing
- Queue management

**State Model**:
```
IDLE → PROCESSING → VALIDATING → COMMITTING → IDLE
                         ↓
                     REJECTED
```

### 1.4 API Integration Nodes
**Purpose**: External data ingestion (Alpaca, OpenWeatherMap)  
**Responsibilities**:
- External API connectivity
- Data transformation
- Rate limiting management
- Error handling and retry logic

**State Model**:
```
DISCONNECTED → CONNECTING → ACTIVE → STREAMING → DISCONNECTED
                    ↓           ↓
                 ERROR ←→ RATE_LIMITED
```

## 2. Node Configuration Schema

### 2.1 Base Node Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "type", "name"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^node-[a-z]+-[0-9]{3}$",
      "description": "Unique node identifier (e.g., node-channel-001)"
    },
    "type": {
      "type": "string",
      "enum": ["channel", "validator", "business", "api-integration"]
    },
    "name": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50
    },
    "enabled": {
      "type": "boolean",
      "default": true
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "version": { "type": "string", "default": "1.0.0" }
      }
    }
  }
}
```

### 2.2 Channel Node Configuration
```json
{
  "allOf": [
    { "$ref": "#/definitions/BaseNode" },
    {
      "properties": {
        "config": {
          "type": "object",
          "properties": {
            "maxConnections": { "type": "integer", "minimum": 1, "maximum": 1000, "default": 100 },
            "routingAlgorithm": { "type": "string", "enum": ["round-robin", "least-connections", "weighted"], "default": "round-robin" },
            "bufferSize": { "type": "integer", "default": 10000 },
            "timeout": { "type": "integer", "default": 30000 }
          }
        }
      }
    }
  ]
}
```

### 2.3 Validator Node Configuration
```json
{
  "allOf": [
    { "$ref": "#/definitions/BaseNode" },
    {
      "properties": {
        "config": {
          "type": "object",
          "properties": {
            "stakeAmount": { "type": "number", "minimum": 1000, "default": 10000 },
            "votingPower": { "type": "number", "minimum": 1, "maximum": 100, "default": 1 },
            "consensusTimeout": { "type": "integer", "default": 5000 },
            "maxBlockSize": { "type": "integer", "default": 1000000 }
          }
        }
      }
    }
  ]
}
```

### 2.4 Business Node Configuration
```json
{
  "allOf": [
    { "$ref": "#/definitions/BaseNode" },
    {
      "properties": {
        "config": {
          "type": "object",
          "properties": {
            "processingCapacity": { "type": "integer", "minimum": 100, "default": 10000 },
            "queueSize": { "type": "integer", "default": 50000 },
            "batchSize": { "type": "integer", "default": 100 },
            "parallelThreads": { "type": "integer", "default": 16 }
          }
        }
      }
    }
  ]
}
```

### 2.5 API Integration Node Configuration
```json
{
  "allOf": [
    { "$ref": "#/definitions/BaseNode" },
    {
      "properties": {
        "config": {
          "type": "object",
          "properties": {
            "provider": { "type": "string", "enum": ["alpaca", "openweathermap"] },
            "apiKey": { "type": "string" },
            "apiSecret": { "type": "string" },
            "endpoint": { "type": "string", "format": "uri" },
            "updateFrequency": { "type": "integer", "minimum": 1000, "default": 5000 },
            "rateLimit": { "type": "integer", "default": 200 },
            "retryAttempts": { "type": "integer", "default": 3 },
            "locations": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    }
  ]
}
```

## 3. Node Lifecycle Management

### 3.1 Lifecycle States
```
CREATE → INITIALIZE → START → RUNNING → PAUSE → RESUME → STOP → DESTROY
                                  ↓
                              ERROR → RECOVER
```

### 3.2 State Transitions
| From State | Event | To State | Actions |
|-----------|-------|----------|---------|
| CREATE | initialize() | INITIALIZE | Allocate resources, validate config |
| INITIALIZE | start() | START | Connect to network, register with coordinator |
| START | ready() | RUNNING | Begin processing, emit status |
| RUNNING | pause() | PAUSE | Suspend processing, maintain connections |
| PAUSE | resume() | RUNNING | Resume processing |
| RUNNING | stop() | STOP | Graceful shutdown, flush queues |
| STOP | destroy() | DESTROY | Release resources, cleanup |
| RUNNING | error() | ERROR | Log error, attempt recovery |
| ERROR | recover() | RUNNING | Retry initialization, restore state |

### 3.3 Lifecycle Hooks
```javascript
class NodeLifecycle {
  // Pre-hooks
  async beforeInitialize() { /* Validation, prerequisites */ }
  async beforeStart() { /* Connection setup */ }
  async beforeStop() { /* Flush queues, save state */ }
  
  // Post-hooks
  async afterInitialize() { /* Emit initialized event */ }
  async afterStart() { /* Begin monitoring */ }
  async afterStop() { /* Cleanup connections */ }
  
  // Error hooks
  async onError(error) { /* Log, notify, attempt recovery */ }
  async onRecover() { /* Restore state, reconnect */ }
}
```

## 4. Inter-Node Communication Protocol

### 4.1 Message Format
```json
{
  "messageId": "msg-uuid-v4",
  "timestamp": "2025-10-04T10:00:00.000Z",
  "from": "node-channel-001",
  "to": "node-validator-003",
  "type": "MESSAGE_TYPE",
  "priority": 1,
  "payload": {},
  "metadata": {
    "retryCount": 0,
    "ttl": 30000,
    "signature": "0x..."
  }
}
```

### 4.2 Message Types
| Type | Direction | Purpose | Payload |
|------|-----------|---------|---------|
| NODE_STATUS | Any → All | Broadcast node status | { state, metrics } |
| TRANSACTION | Business → Validator | Submit transaction | { tx, signature } |
| CONSENSUS_VOTE | Validator → Validator | Cast consensus vote | { blockHash, vote } |
| DATA_FEED | API → Channel → Business | External data | { provider, data, timestamp } |
| ROUTE_MESSAGE | Channel → Channel | Route to destination | { destination, message } |
| HEARTBEAT | Any → Coordinator | Liveness check | { nodeId, uptime } |

### 4.3 Communication Patterns

**1. Request-Response**
```
Client → Server: REQUEST { id, data }
Server → Client: RESPONSE { id, result/error }
```

**2. Publish-Subscribe**
```
Publisher → Topic: PUBLISH { topic, data }
Topic → Subscribers: NOTIFY { topic, data }
```

**3. Broadcast**
```
Sender → All: BROADCAST { data }
```

**4. Point-to-Point**
```
NodeA → NodeB: SEND { recipient, data }
```

### 4.4 Transport Layer
- **Primary**: WebSocket (bidirectional, real-time)
- **Fallback**: HTTP/2 Server-Sent Events (SSE)
- **Encoding**: JSON (default), MessagePack (high-performance)
- **Compression**: gzip (enabled for messages > 1KB)

## 5. Node Panel UI/UX Design

### 5.1 Panel Layout (Grid System)
```
┌─────────────────────────────────────────┐
│ Node Panel: [Type] [Name] [ID]          │
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │   STATUS    │ │   LIVE METRICS      │ │
│ │   Badge     │ │   • TPS: 10,234     │ │
│ │             │ │   • Queue: 1,523    │ │
│ └─────────────┘ │   • CPU: 45%        │ │
│                 │   • Memory: 512MB   │ │
│                 └─────────────────────┘ │
├─────────────────────────────────────────┤
│        Mini Activity Graph (Sparkline)   │
│        ▁▂▃▅▆▇█▇▆▅▃▂▁                    │
├─────────────────────────────────────────┤
│ [Actions]  [⚙️ Config]  [📊 Details]    │
└─────────────────────────────────────────┘
```

### 5.2 Color Coding
| State | Color | Badge |
|-------|-------|-------|
| IDLE | Gray (#6B7280) | ⚪ Idle |
| ACTIVE | Green (#10B981) | 🟢 Active |
| PROCESSING | Blue (#3B82F6) | 🔵 Processing |
| CONSENSUS | Purple (#8B5CF6) | 🟣 Consensus |
| ERROR | Red (#EF4444) | 🔴 Error |
| WARNING | Yellow (#F59E0B) | 🟡 Warning |

### 5.3 Panel Types

**Channel Node Panel**:
```
┌─ Channel-001 ─────────────────────────┐
│ 🟢 ROUTING  │ Connections: 47/100    │
│             │ Throughput: 15.2K msg/s │
│             │ Routing Eff: 99.8%      │
│ ▁▂▃▅▆▇█▇▆▅▃▂▁                         │
│ [Pause] [Configure] [View Logs]       │
└───────────────────────────────────────┘
```

**Validator Node Panel**:
```
┌─ Validator-003 ───────────────────────┐
│ 🟣 LEADER   │ Role: Leader           │
│             │ Votes: 7/10            │
│             │ Blocks: 1,234          │
│             │ Stake: 50,000 AUR      │
│ ▁▂▃▅▆▇█▇▆▅▃▂▁                         │
│ [Step Down] [Configure] [Details]     │
└───────────────────────────────────────┘
```

**Business Node Panel**:
```
┌─ Business-002 ────────────────────────┐
│ 🔵 PROCESSING │ TPS: 8,542          │
│               │ Queue: 2,341/50K    │
│               │ Success: 99.95%     │
│               │ Avg Time: 12ms      │
│ ▁▂▃▅▆▇█▇▆▅▃▂▁                         │
│ [Pause] [Configure] [Analytics]       │
└───────────────────────────────────────┘
```

**API Integration Panel**:
```
┌─ Alpaca-001 ──────────────────────────┐
│ 🟢 STREAMING │ Provider: Alpaca      │
│              │ Feed Rate: 50/sec     │
│              │ Last: 10:45:23        │
│              │ Quota: 145/200        │
│ ▁▂▃▅▆▇█▇▆▅▃▂▁                         │
│ [🔘 On] [Configure] [View Data]       │
└───────────────────────────────────────┘
```

### 5.4 Responsive Design Breakpoints
- **Desktop** (>1200px): 4 panels per row
- **Tablet** (768px-1200px): 2 panels per row
- **Mobile** (<768px): 1 panel per row, stacked

### 5.5 Real-Time Updates
- **Update Frequency**: 250ms (4 FPS for smooth animation)
- **Animation**: CSS transitions (300ms ease-in-out)
- **Sparkline**: Rolling 60-second window
- **Badge Pulse**: Animate on state change

## 6. Architecture Diagrams

### 6.1 System Overview
```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Vizro   │  │  Node    │  │  Config  │             │
│  │  Graphs  │  │  Panels  │  │  Modal   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       └─────────────┴─────────────┘                    │
│                     │                                   │
│              WebSocket Layer                            │
│                     │                                   │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                COORDINATOR                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Node Registry  │  Message Router  │  Monitor  │    │
│  └────────────────────────────────────────────────┘    │
│       │                  │                  │           │
└───────┼──────────────────┼──────────────────┼───────────┘
        │                  │                  │
   ┌────┴────┐        ┌────┴────┐       ┌────┴────┐
   │ Channel │        │Validator│       │Business │
   │  Nodes  │        │  Nodes  │       │  Nodes  │
   └─────────┘        └─────────┘       └─────────┘
                           │
                      ┌────┴────┐
                      │   API   │
                      │  Nodes  │
                      └─────────┘
```

### 6.2 Data Flow
```
External API → API Node → Channel Node → Business Node → Validator Node → Blockchain
                                ↓
                           UI Update via WebSocket
```

## 7. Implementation Notes

### 7.1 Technology Stack
- **Frontend**: HTML5, vanilla JavaScript, D3.js/Vizro
- **Backend Coordinator**: Aurigraph V11 (Java/Quarkus)
- **WebSocket**: Quarkus WebSocket
- **Data Format**: JSON (message protocol)
- **Storage**: In-memory (demo), Redis (optional persistence)

### 7.2 Performance Targets
- **Node Startup**: < 500ms
- **Message Latency**: < 50ms (p99)
- **UI Update Rate**: 60 FPS
- **Max Nodes**: 200 simultaneous
- **Throughput**: 2M+ TPS (simulated)

### 7.3 Next Steps (AV11-194 onwards)
1. Implement Channel Node System
2. Implement Validator Node System
3. Implement Business Node System
4. Implement API Integration Nodes
5. Create visualization layer

---

**Architecture Design Complete**: ✅  
**Ready for Implementation**: AV11-194
