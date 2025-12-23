# API Integration Plan
**Phase 1, Task 1.1.3 - API Integration Planning**
**Date**: October 9, 2025
**Project**: AV11-DEMO-MOBILE-2025
**Version**: 1.0

---

## Document Overview

This document defines the complete API integration strategy for the Aurigraph DLT mobile and enterprise portal applications. It covers 5 API integrations: V11 Backend REST, V11 Backend WebSocket, Alpaca Markets, OpenWeatherMap, and X.com (Twitter).

---

## 1. Integration Architecture Overview

### 1.1 Integration Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Mobile App / Enterprise Portal                              │
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ V11Backend     │  │ APIIntegration │  │ WebSocket      │ │
│  │ Client         │  │ Node           │  │ Manager        │ │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘ │
│          │                   │                   │           │
└──────────┼───────────────────┼───────────────────┼───────────┘
           │                   │                   │
           │ REST API          │ External APIs     │ WebSocket
           │ (HTTP/HTTPS)      │ (HTTPS)           │ (WS/WSS)
           │                   │                   │
┌──────────▼───────────────────▼───────────────────▼───────────┐
│  External Services                                            │
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Aurigraph V11  │  │ Alpaca Markets │  │ OpenWeatherMap │ │
│  │ Backend        │  │ API            │  │ API            │ │
│  │ :9003          │  └────────────────┘  └────────────────┘ │
│  │                │                                          │
│  │ REST + WS      │  ┌────────────────┐                     │
│  └────────────────┘  │ X.com (Twitter)│                     │
│                      │ API v2         │                     │
│                      └────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Layers

#### Layer 1: API Clients (Low-level HTTP/WebSocket)
- **V11BackendClient**: REST API wrapper for V11 backend
- **WebSocketManager**: WebSocket client with reconnection logic
- **AlpacaClient**: Alpaca Markets API wrapper
- **WeatherClient**: OpenWeatherMap API wrapper
- **TwitterClient**: X.com API v2 wrapper

#### Layer 2: Data Models
- **Transaction**, **Block**, **Node**, **ConsensusState** (V11)
- **StockQuote**, **WeatherData**, **Tweet** (External)
- Serialization/deserialization (JSON)

#### Layer 3: Repositories (Business Logic)
- **V11Repository**: Aggregates REST + WebSocket data
- **FeedRepository**: Manages all external feeds
- Caching, retry logic, error handling

#### Layer 4: State Management (UI Layer)
- **BLoC** (Flutter) or **Redux** (React Native/React)
- Exposes data to UI components
- Handles user actions

---

## 2. V11 Backend REST API Integration

### 2.1 Base Configuration

```typescript
{
  baseUrl: "http://localhost:9003",
  apiPrefix: "/api/v11",
  timeout: 30000,        // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,      // 1 second, exponential backoff
  cacheExpiry: 5000,     // 5 seconds for health/info endpoints
}
```

### 2.2 Endpoint Specifications

#### 2.2.1 System Endpoints

##### GET /api/v11/health
**Purpose**: Health check for backend availability

**Request**:
```http
GET http://localhost:9003/api/v11/health HTTP/1.1
Accept: application/json
```

**Response** (200 OK):
```json
{
  "status": "HEALTHY",
  "version": "11.0.0-standalone",
  "uptimeSeconds": 3600,
  "totalRequests": 12450,
  "platform": "Java/Quarkus/GraalVM"
}
```

**Error Handling**:
- **Timeout** (30s): Switch to demo mode
- **5xx errors**: Retry 3 times, then switch to demo mode
- **Network error**: Auto-retry with exponential backoff

**Caching**: 5 seconds TTL

**Usage**: Connection status check, every 60 seconds when in live mode

---

##### GET /api/v11/info
**Purpose**: System information and capabilities

**Response** (200 OK):
```json
{
  "name": "Aurigraph V11 Standalone",
  "version": "11.0.0",
  "build": "2025-10-09T12:00:00Z",
  "capabilities": [
    "REST_API",
    "WEBSOCKET",
    "GRPC",
    "AI_OPTIMIZATION",
    "QUANTUM_CRYPTO",
    "CROSS_CHAIN_BRIDGE",
    "HMS_INTEGRATION"
  ],
  "nodeCount": 12,
  "consensusProtocol": "HyperRAFT++",
  "targetTPS": 2000000
}
```

**Caching**: 5 seconds TTL

**Usage**: Display in About screen, capability detection

---

##### GET /api/v11/performance
**Purpose**: Performance testing and TPS measurement

**Response** (200 OK):
```json
{
  "iterations": 100000,
  "durationMs": 44.52,
  "transactionsPerSecond": 2246349.66,
  "nsPerTransaction": 445.0,
  "targetTPS": 2000000,
  "targetAchieved": true,
  "efficiency": 112.3
}
```

**Usage**: Real-time TPS measurement for dashboard

**Update Frequency**: Every 1-5 seconds based on performance mode

---

##### GET /api/v11/stats
**Purpose**: Transaction and system statistics

**Response** (200 OK):
```json
{
  "totalTransactions": 12453920000,
  "totalBlocks": 1245392,
  "averageBlockTime": 125,
  "averageTPS": 1246000,
  "peakTPS": 2246350,
  "consensusEfficiency": 98.5,
  "uptime": 86400
}
```

**Usage**: Dashboard metrics cards

**Update Frequency**: Every 5 seconds

---

#### 2.2.2 Transaction Endpoints

##### POST /api/v11/transactions
**Purpose**: Submit transaction to the network

**Request**:
```http
POST http://localhost:9003/api/v11/transactions HTTP/1.1
Content-Type: application/json

{
  "from": "0x1234567890abcdef1234567890abcdef12345678",
  "to": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  "amount": 100.50,
  "data": "Test transaction",
  "signature": "0x..."
}
```

**Response** (201 Created):
```json
{
  "transactionId": "TX_1760029805129_6bcc6aa1",
  "status": "PENDING",
  "timestamp": "2025-10-09T14:30:05Z",
  "expectedConfirmation": "2025-10-09T14:30:10Z"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid transaction format
- **429 Too Many Requests**: Rate limit exceeded
- **503 Service Unavailable**: Backend overloaded

**Usage**: Transaction submission form in mobile app

---

##### GET /api/v11/transactions/{id}
**Purpose**: Get transaction details by ID

**Response** (200 OK):
```json
{
  "transactionId": "TX_1760029805129_6bcc6aa1",
  "from": "0x1234...",
  "to": "0xabcd...",
  "amount": 100.50,
  "data": "Test transaction",
  "status": "CONFIRMED",
  "blockNumber": 1245393,
  "blockHash": "0x...",
  "confirmations": 6,
  "timestamp": "2025-10-09T14:30:05Z"
}
```

**Usage**: Transaction tracking and history

---

#### 2.2.3 Consensus Endpoints

##### GET /api/v11/consensus/nodes
**Purpose**: Get consensus state and validator nodes

**Response** (200 OK):
```json
{
  "consensusHealth": "HEALTHY",
  "nodes": [
    {
      "nodeId": "84121587-b67e-48c1-8e11-fac3d0db2576",
      "role": "LEADER",
      "status": "ACTIVE",
      "currentTerm": 42,
      "throughput": 1250000,
      "blocksValidated": 12453,
      "votingPower": 1,
      "lastHeartbeat": "2025-10-09T14:30:05Z"
    },
    {
      "nodeId": "node-validator-002",
      "role": "FOLLOWER",
      "status": "ACTIVE",
      "currentTerm": 42,
      "throughput": 0,
      "blocksValidated": 12452,
      "votingPower": 1,
      "lastHeartbeat": "2025-10-09T14:30:05Z"
    }
  ],
  "leaderNode": "84121587-b67e-48c1-8e11-fac3d0db2576",
  "totalNodes": 3,
  "quorumSize": 2,
  "currentTerm": 42,
  "consensusAlgorithm": "HyperRAFT++"
}
```

**Usage**: Consensus chart, validator node visualization

**Update Frequency**: Every 2 seconds (leader election can happen quickly)

---

##### GET /api/v11/consensus/state
**Purpose**: Get current consensus state summary

**Response** (200 OK):
```json
{
  "state": "STABLE",
  "currentLeader": "84121587-b67e-48c1-8e11-fac3d0db2576",
  "currentTerm": 42,
  "lastElection": "2025-10-09T12:15:00Z",
  "termDuration": 8405,
  "participationRate": 100.0
}
```

**Usage**: Quick consensus status for dashboard

---

#### 2.2.4 Channel Endpoints

##### GET /api/v11/channels
**Purpose**: List all communication channels

**Response** (200 OK):
```json
{
  "channels": [
    {
      "channelId": "CH_1760029787886_ac5b234f",
      "name": "Test Channel",
      "description": "Performance test",
      "type": "PUBLIC",
      "status": "ACTIVE",
      "memberCount": 1,
      "messageCount": 145,
      "created": "2025-10-09T14:23:07Z"
    }
  ],
  "totalChannels": 1
}
```

**Usage**: Channel list in nodes view

---

##### POST /api/v11/channels
**Purpose**: Create a new channel

**Request**:
```json
{
  "name": "Test Channel",
  "description": "Performance test",
  "type": "PUBLIC",
  "participants": ["user1@example.com"]
}
```

**Response** (201 Created):
```json
{
  "channelId": "CH_1760029787886_ac5b234f",
  "status": "ACTIVE",
  "name": "Test Channel",
  "memberCount": 1
}
```

---

##### POST /api/v11/channels/{channelId}/messages
**Purpose**: Send message to channel

**Request**:
```json
{
  "content": "Test message",
  "senderAddress": "user1@example.com"
}
```

**Response** (201 Created):
```json
{
  "messageId": "MSG_1760029805129_6bcc6aa1",
  "channelId": "CH_1760029787886_ac5b234f",
  "timestamp": "2025-10-09T14:30:05Z"
}
```

---

#### 2.2.5 Blockchain Endpoints

##### GET /api/v11/blockchain/height
**Purpose**: Get current blockchain height

**Response** (200 OK):
```json
{
  "height": 1245393,
  "timestamp": "2025-10-09T14:30:05Z"
}
```

---

##### GET /api/v11/blockchain/blocks/{height}
**Purpose**: Get block by height

**Response** (200 OK):
```json
{
  "blockNumber": 1245393,
  "blockHash": "0x...",
  "previousHash": "0x...",
  "timestamp": "2025-10-09T14:30:00Z",
  "transactionCount": 1000,
  "validator": "84121587-b67e-48c1-8e11-fac3d0db2576",
  "merkleRoot": "0x...",
  "size": 125000
}
```

---

### 2.3 Error Handling Strategy

#### HTTP Status Code Mapping

| Status | Meaning | Client Action |
|--------|---------|---------------|
| 200 | Success | Process response |
| 201 | Created | Process response, show success message |
| 400 | Bad Request | Show validation error to user |
| 401 | Unauthorized | Show authentication error (future) |
| 404 | Not Found | Show "Resource not found" error |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry up to 3 times, then show error |
| 503 | Unavailable | Switch to demo mode if repeated failures |
| Timeout | Network timeout | Retry with exponential backoff |
| Network | No connection | Show offline indicator, switch to demo mode |

#### Retry Logic

```typescript
async function requestWithRetry(endpoint, options, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, options);

      if (response.ok) {
        return await response.json();
      }

      // Don't retry 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // Retry 5xx errors (server errors)
      lastError = new Error(`Server error: ${response.status}`);

    } catch (error) {
      lastError = error;
    }

    // Wait before retry: 1s, 2s, 4s
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

---

### 2.4 Caching Strategy

#### Cache Policy

| Endpoint | Cache TTL | Reason |
|----------|-----------|--------|
| `/health` | 5 seconds | Minimize redundant health checks |
| `/info` | 5 seconds | System info rarely changes |
| `/performance` | No cache | Real-time performance data |
| `/stats` | No cache | Real-time statistics |
| `/consensus/nodes` | No cache | Consensus state changes rapidly |
| `/transactions/{id}` | 60 seconds | Transaction state stabilizes after confirmation |
| `/blockchain/blocks/{height}` | Infinite | Blocks are immutable |

#### Cache Implementation (TypeScript)

```typescript
class APICache {
  private cache: Map<string, CacheEntry>;

  get(key: string, ttl: number): any | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;

    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

### 2.5 Rate Limiting

#### Client-side Rate Limiting

**Goal**: Prevent overwhelming the V11 backend

**Implementation**:
```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 100;  // 100 requests per minute
  private windowMs = 60000;    // 1 minute

  async throttle(): Promise<void> {
    const now = Date.now();

    // Remove requests outside window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if limit reached
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      console.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Record this request
    this.requests.push(now);
  }
}
```

---

## 3. V11 Backend WebSocket Integration

### 3.1 WebSocket Configuration

```typescript
{
  url: "ws://localhost:9003/ws",
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  messageQueueSize: 100,
  autoConnect: true
}
```

### 3.2 Connection Management

#### State Machine

```
DISCONNECTED → CONNECTING → CONNECTED ⇄ RECONNECTING
     ↑              ↓             ↓
     └──────────────┴─────────────┘
```

#### Reconnection Strategy

```typescript
class WebSocketReconnectionStrategy {
  private attempts = 0;
  private maxAttempts = 10;

  async reconnect(wsManager: WebSocketManager): Promise<void> {
    while (this.attempts < this.maxAttempts) {
      const delay = Math.min(Math.pow(2, this.attempts) * 1000, 60000);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.attempts + 1}/${this.maxAttempts})`);

      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        await wsManager.connect();
        this.attempts = 0;  // Reset on success
        return;
      } catch (error) {
        this.attempts++;
        console.error(`Reconnect failed:`, error);
      }
    }

    // Max attempts reached, switch to demo mode
    console.error('Max reconnect attempts reached, switching to demo mode');
    wsManager.emit('reconnect-failed');
  }
}
```

---

### 3.3 Message Protocol

#### Client → Server Messages

##### Subscribe to Node Updates
```json
{
  "type": "subscribe",
  "data": {
    "channel": "node-updates",
    "nodeId": "84121587-b67e-48c1-8e11-fac3d0db2576"
  },
  "timestamp": 1696867200000,
  "id": "msg-uuid-1234"
}
```

##### Subscribe to System Metrics
```json
{
  "type": "subscribe",
  "data": {
    "channel": "system-metrics"
  },
  "timestamp": 1696867200000,
  "id": "msg-uuid-1235"
}
```

##### Heartbeat (Ping)
```json
{
  "type": "ping",
  "data": {
    "timestamp": 1696867200000
  },
  "timestamp": 1696867200000,
  "id": "msg-uuid-1236"
}
```

---

#### Server → Client Messages

##### Node Update Event
```json
{
  "type": "node-update",
  "data": {
    "nodeId": "84121587-b67e-48c1-8e11-fac3d0db2576",
    "role": "LEADER",
    "status": "ACTIVE",
    "throughput": 1250000,
    "metrics": {
      "blocksValidated": 12454,
      "consensusRounds": 42,
      "participationRate": 100.0
    }
  },
  "timestamp": 1696867205000
}
```

##### System Metrics Event
```json
{
  "type": "system-metrics",
  "data": {
    "tps": 1246392,
    "totalTransactions": 12453920000,
    "activeNodes": 12,
    "consensusState": {
      "currentLeader": "84121587-b67e-48c1-8e11-fac3d0db2576",
      "term": 42
    },
    "avgFinalityLatency": 125
  },
  "timestamp": 1696867205000
}
```

##### Heartbeat Response (Pong)
```json
{
  "type": "pong",
  "data": {
    "timestamp": 1696867200000
  },
  "timestamp": 1696867200500
}
```

---

### 3.4 Message Queuing

**Purpose**: Buffer messages when WebSocket is disconnected

**Implementation**:
```typescript
class MessageQueue {
  private queue: Message[] = [];
  private maxSize = 100;

  enqueue(message: Message): boolean {
    if (this.queue.length >= this.maxSize) {
      console.warn('Message queue full, dropping oldest message');
      this.queue.shift();
    }

    this.queue.push(message);
    return true;
  }

  dequeue(): Message | undefined {
    return this.queue.shift();
  }

  flush(sendCallback: (message: Message) => void): void {
    while (this.queue.length > 0) {
      const message = this.dequeue();
      if (message) {
        sendCallback(message);
      }
    }
  }

  size(): number {
    return this.queue.length;
  }
}
```

---

### 3.5 Fallback to REST Polling

**Scenario**: WebSocket connection repeatedly fails

**Strategy**: Fallback to REST API polling

```typescript
class V11DataSync {
  private wsManager: WebSocketManager;
  private pollingInterval: number | null = null;

  async start(): Promise<void> {
    try {
      await this.wsManager.connect();

      // Subscribe to channels
      this.wsManager.send('subscribe', { channel: 'system-metrics' });
      this.wsManager.send('subscribe', { channel: 'node-updates' });

    } catch (error) {
      console.warn('WebSocket connection failed, falling back to REST polling');
      this.startRESTPolling();
    }
  }

  startRESTPolling(): void {
    const v11Client = new V11BackendClient();

    this.pollingInterval = setInterval(async () => {
      try {
        // Poll stats endpoint every 5 seconds
        const stats = await v11Client.getStats();
        this.emit('system-metrics', stats);

        // Poll consensus every 2 seconds
        const consensus = await v11Client.getConsensusState();
        this.emit('consensus-update', consensus);

      } catch (error) {
        console.error('REST polling failed:', error);
      }
    }, 5000);
  }

  stop(): void {
    this.wsManager.disconnect();

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
```

---

## 4. Alpaca Markets API Integration

### 4.1 API Configuration

```typescript
{
  provider: 'alpaca',
  endpoint: 'https://data.alpaca.markets/v2',
  apiKey: process.env.ALPACA_API_KEY || 'DEMO_KEY',
  apiSecret: process.env.ALPACA_API_SECRET || '',
  updateFrequency: 5000,  // 5 seconds
  rateLimit: 200,         // 200 requests per minute (free tier)
  symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD']
}
```

### 4.2 Authentication

**Method**: API Key + Secret in HTTP headers

**Headers**:
```http
APCA-API-KEY-ID: your-api-key-here
APCA-API-SECRET-KEY: your-api-secret-here
```

### 4.3 Endpoint: Latest Stock Quotes

**Request**:
```http
GET https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=AAPL,GOOGL,MSFT HTTP/1.1
APCA-API-KEY-ID: your-api-key
APCA-API-SECRET-KEY: your-secret
```

**Response** (200 OK):
```json
{
  "quotes": {
    "AAPL": {
      "t": "2025-10-09T14:30:05.123456Z",
      "ax": "Q",
      "ap": 175.24,
      "as": 100,
      "bx": "Q",
      "bp": 175.23,
      "bs": 200,
      "c": ["R"]
    },
    "GOOGL": {
      "t": "2025-10-09T14:30:05.234567Z",
      "ax": "N",
      "ap": 140.15,
      "as": 50,
      "bx": "N",
      "bp": 140.14,
      "bs": 75,
      "c": ["R"]
    }
  }
}
```

**Data Transformation** (to app format):
```json
{
  "symbol": "AAPL",
  "price": 175.24,
  "volume": 100,
  "change": 0.82,
  "changePercent": 0.47,
  "timestamp": "2025-10-09T14:30:05Z"
}
```

---

### 4.4 Demo Mode (Mock Data Generator)

**Purpose**: Generate realistic stock data when API key is missing or DEMO mode enabled

```typescript
class AlpacaMockDataGenerator {
  private basePrices: Record<string, number> = {
    'AAPL': 175.00,
    'GOOGL': 140.00,
    'MSFT': 380.00,
    'AMZN': 145.00,
    'TSLA': 250.00,
    'META': 320.00,
    'NVDA': 480.00,
    'AMD': 125.00
  };

  generate(symbol: string): StockQuote {
    const basePrice = this.basePrices[symbol] || 100.00;

    // 2% random variance
    const variance = basePrice * 0.02;
    const price = basePrice + (Math.random() * variance * 2 - variance);

    // Random volume (1M - 10M)
    const volume = Math.floor(Math.random() * 9000000 + 1000000);

    // Random change (-5% to +5%)
    const change = (Math.random() * 10 - 5);
    const changePercent = (change / price) * 100;

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      volume,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }

  generateBatch(symbols: string[]): StockQuote[] {
    return symbols.map(symbol => this.generate(symbol));
  }
}
```

---

### 4.5 Rate Limiting

**Alpaca Free Tier**: 200 requests per minute

**Implementation**:
```typescript
class AlpacaRateLimiter {
  private requests: number[] = [];
  private maxRequests = 200;
  private windowMs = 60000;  // 1 minute

  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // Remove old requests
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      console.warn('Alpaca rate limit reached');
      return false;  // Rate limited
    }

    this.requests.push(now);
    return true;  // OK to proceed
  }
}
```

---

### 4.6 Error Handling

| Error | HTTP Status | Action |
|-------|-------------|--------|
| Invalid API key | 401 | Switch to demo mode, show error message |
| Rate limit exceeded | 429 | Wait for quota reset, use cached data |
| Symbol not found | 404 | Remove symbol from list, show warning |
| Server error | 5xx | Retry 3 times, then use cached data |
| Network timeout | N/A | Retry, then use cached data |

---

## 5. OpenWeatherMap API Integration

### 5.1 API Configuration

```typescript
{
  provider: 'openweathermap',
  endpoint: 'https://api.openweathermap.org/data/2.5',
  apiKey: process.env.OPENWEATHERMAP_API_KEY || 'DEMO_KEY',
  updateFrequency: 60000,  // 60 seconds (weather changes slowly)
  rateLimit: 60,           // 60 requests per minute (free tier)
  locations: ['New York', 'London', 'Tokyo', 'Singapore']
}
```

### 5.2 Authentication

**Method**: API Key in query parameter

**URL Format**: `?q={city}&appid={apiKey}&units=metric`

### 5.3 Endpoint: Current Weather

**Request**:
```http
GET https://api.openweathermap.org/data/2.5/weather?q=London&appid=your-api-key&units=metric HTTP/1.1
```

**Response** (200 OK):
```json
{
  "coord": { "lon": -0.1257, "lat": 51.5085 },
  "weather": [
    {
      "id": 803,
      "main": "Clouds",
      "description": "broken clouds",
      "icon": "04d"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 15.5,
    "feels_like": 14.8,
    "temp_min": 13.2,
    "temp_max": 17.3,
    "pressure": 1015,
    "humidity": 72
  },
  "wind": {
    "speed": 4.5,
    "deg": 230
  },
  "dt": 1696867200,
  "sys": {
    "country": "GB",
    "sunrise": 1696835400,
    "sunset": 1696876200
  },
  "timezone": 0,
  "name": "London"
}
```

**Data Transformation** (to app format):
```json
{
  "location": "London",
  "temperature": 15.5,
  "humidity": 72,
  "pressure": 1015,
  "windSpeed": 4.5,
  "description": "Broken clouds",
  "timestamp": "2025-10-09T14:30:00Z"
}
```

---

### 5.4 Demo Mode (Mock Data Generator)

```typescript
class WeatherMockDataGenerator {
  private weatherConditions = [
    'Clear sky', 'Few clouds', 'Scattered clouds', 'Broken clouds',
    'Light rain', 'Moderate rain', 'Thunderstorm', 'Snow', 'Mist', 'Fog'
  ];

  generate(location: string): WeatherData {
    return {
      location,
      temperature: parseFloat((Math.random() * 30 + 10).toFixed(1)),  // 10-40°C
      humidity: Math.floor(Math.random() * 60 + 30),  // 30-90%
      pressure: Math.floor(Math.random() * 50 + 990),  // 990-1040 hPa
      windSpeed: parseFloat((Math.random() * 20).toFixed(1)),  // 0-20 m/s
      description: this.weatherConditions[
        Math.floor(Math.random() * this.weatherConditions.length)
      ],
      timestamp: new Date().toISOString()
    };
  }

  generateBatch(locations: string[]): WeatherData[] {
    return locations.map(location => this.generate(location));
  }
}
```

---

### 5.5 Rate Limiting

**OpenWeatherMap Free Tier**: 60 requests per minute

**Implementation**: Same as Alpaca (sliding window algorithm)

---

## 6. X.com (Twitter) API v2 Integration

### 6.1 API Configuration

```typescript
{
  provider: 'twitter',
  endpoint: 'https://api.twitter.com/2',
  apiKey: process.env.TWITTER_BEARER_TOKEN || 'DEMO_TOKEN',
  updateFrequency: 60000,  // 60 seconds
  rateLimit: 15,           // 15 requests per 15 minutes (free tier)
  topics: ['#blockchain', '#crypto', '#DeFi', '#Web3', '#Aurigraph']
}
```

### 6.2 Authentication

**Method**: Bearer Token in Authorization header

**Headers**:
```http
Authorization: Bearer your-bearer-token-here
```

### 6.3 Endpoint: Search Recent Tweets

**Request**:
```http
GET https://api.twitter.com/2/tweets/search/recent?query=%23blockchain&max_results=10&tweet.fields=public_metrics,created_at HTTP/1.1
Authorization: Bearer your-bearer-token
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "1234567890123456789",
      "text": "Just saw amazing developments in #blockchain! The future is here 🚀",
      "created_at": "2025-10-09T14:25:00.000Z",
      "public_metrics": {
        "retweet_count": 125,
        "reply_count": 45,
        "like_count": 580,
        "quote_count": 12
      }
    }
  ],
  "meta": {
    "result_count": 10
  }
}
```

**Data Transformation** (to app format with sentiment):
```json
{
  "topic": "#blockchain",
  "username": "@CryptoWhale",
  "text": "Just saw amazing developments in #blockchain! The future is here 🚀",
  "likes": 580,
  "retweets": 125,
  "replies": 45,
  "sentiment": "positive",
  "sentimentScore": 0.85,
  "engagement": 750,
  "timestamp": "2025-10-09T14:25:00Z"
}
```

---

### 6.4 Sentiment Analysis (Client-side)

**Purpose**: Analyze tweet sentiment without external API

**Simple Keyword-based Sentiment**:
```typescript
class SimpleSentimentAnalyzer {
  private positiveKeywords = [
    'amazing', 'great', 'excellent', 'love', 'fantastic', 'awesome',
    'bullish', 'moon', 'revolutionary', 'innovation', 'breakthrough'
  ];

  private negativeKeywords = [
    'bad', 'terrible', 'awful', 'hate', 'crash', 'scam',
    'bearish', 'dump', 'fraud', 'ponzi', 'risk'
  ];

  analyze(text: string): { sentiment: string; score: number } {
    const lowerText = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of this.positiveKeywords) {
      if (lowerText.includes(word)) positiveCount++;
    }

    for (const word of this.negativeKeywords) {
      if (lowerText.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;

    if (total === 0) {
      return { sentiment: 'neutral', score: 0.5 };
    }

    const score = (positiveCount / total);

    if (score > 0.6) {
      return { sentiment: 'positive', score };
    } else if (score < 0.4) {
      return { sentiment: 'negative', score };
    } else {
      return { sentiment: 'neutral', score };
    }
  }
}
```

---

### 6.5 Demo Mode (Mock Data Generator)

```typescript
class TwitterMockDataGenerator {
  private usernames = [
    '@CryptoWhale', '@BlockchainDev', '@DeFiTrader',
    '@Web3Builder', '@AurigraphFan', '@CryptoNews'
  ];

  private templates = [
    'Just saw amazing developments in {topic}! The future is here 🚀',
    '{topic} is revolutionizing the industry. Incredible progress!',
    'Breaking: Major update in {topic} space. This changes everything',
    'Analyzing {topic} trends - looking bullish for Q4',
    '{topic} adoption growing faster than expected. Exciting times!'
  ];

  generate(topic: string): Tweet {
    const username = this.usernames[
      Math.floor(Math.random() * this.usernames.length)
    ];

    const template = this.templates[
      Math.floor(Math.random() * this.templates.length)
    ];

    const text = template.replace('{topic}', topic);

    const sentiments = ['positive', 'neutral', 'negative'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    const sentimentScore = sentiment === 'positive'
      ? Math.random() * 0.5 + 0.5  // 0.5 - 1.0
      : sentiment === 'negative'
      ? Math.random() * 0.5        // 0.0 - 0.5
      : Math.random() * 0.2 + 0.4; // 0.4 - 0.6

    return {
      topic,
      username,
      text,
      likes: Math.floor(Math.random() * 10000),
      retweets: Math.floor(Math.random() * 5000),
      replies: Math.floor(Math.random() * 1000),
      sentiment,
      sentimentScore: parseFloat(sentimentScore.toFixed(2)),
      engagement: 0, // calculated below
      timestamp: new Date().toISOString()
    };
  }

  generateBatch(topics: string[]): Tweet[] {
    return topics.map(topic => {
      const tweet = this.generate(topic);
      tweet.engagement = tweet.likes + tweet.retweets + tweet.replies;
      return tweet;
    });
  }
}
```

---

### 6.6 Rate Limiting

**X API Free Tier**: 15 requests per 15 minutes

**Strategy**: Request once per minute for 5 topics (5 req/min), well within limit

---

## 7. Demo Mode vs. Live Mode Strategy

### 7.1 Mode Switching Logic

```typescript
enum APIMode {
  DEMO = 'demo',
  LIVE = 'live'
}

class APIModeManager {
  private currentMode: APIMode = APIMode.DEMO;

  async switchToLive(v11BackendUrl: string): Promise<boolean> {
    try {
      // Test V11 backend connection
      const v11Client = new V11BackendClient({ baseUrl: v11BackendUrl });
      const healthCheck = await v11Client.getHealth();

      if (healthCheck.success && healthCheck.data.status === 'HEALTHY') {
        this.currentMode = APIMode.LIVE;
        console.log('Switched to LIVE mode');
        return true;
      }

    } catch (error) {
      console.warn('Failed to connect to V11 backend, staying in DEMO mode');
    }

    return false;
  }

  switchToDemo(): void {
    this.currentMode = APIMode.DEMO;
    console.log('Switched to DEMO mode');
  }

  isLiveMode(): boolean {
    return this.currentMode === APIMode.LIVE;
  }
}
```

---

### 7.2 Automatic Fallback

**Scenario**: Live mode API fails repeatedly

**Strategy**: Auto-switch to demo mode after 3 consecutive failures

```typescript
class AutoFallbackManager {
  private consecutiveFailures = 0;
  private maxFailures = 3;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(): boolean {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.maxFailures) {
      console.warn('Too many failures, switching to DEMO mode');
      return true;  // Should switch to demo mode
    }

    return false;
  }
}
```

---

## 8. API Testing Strategy

### 8.1 Unit Tests (Mock API Responses)

**Test Coverage**: All API client methods

**Example Test (V11BackendClient)**:
```typescript
describe('V11BackendClient', () => {
  let client: V11BackendClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new V11BackendClient();
  });

  it('should fetch health status successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'HEALTHY',
        version: '11.0.0',
        uptime: 3600
      })
    });

    const result = await client.getHealth();

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('HEALTHY');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:9003/api/v11/health',
      expect.any(Object)
    );
  });

  it('should retry on 500 error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'HEALTHY' })
      });

    const result = await client.getHealth();

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should use cached data within TTL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'HEALTHY' })
    });

    await client.getHealth();  // First call - hits API
    await client.getHealth();  // Second call - uses cache

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

---

### 8.2 Integration Tests (Mock Server)

**Tool**: MSW (Mock Service Worker) for realistic API mocking

**Example Setup**:
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('http://localhost:9003/api/v11/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'HEALTHY',
        version: '11.0.0',
        uptimeSeconds: 3600
      })
    );
  }),

  rest.get('https://data.alpaca.markets/v2/stocks/quotes/latest', (req, res, ctx) => {
    const symbols = req.url.searchParams.get('symbols');

    return res(
      ctx.status(200),
      ctx.json({
        quotes: {
          AAPL: { ap: 175.24, t: new Date().toISOString() }
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration Tests', () => {
  it('should fetch and transform V11 health data', async () => {
    const v11Client = new V11BackendClient();
    const health = await v11Client.getHealth();

    expect(health.data.status).toBe('HEALTHY');
  });

  it('should fetch and transform Alpaca stock data', async () => {
    const alpacaClient = new AlpacaClient();
    const quotes = await alpacaClient.getQuotes(['AAPL']);

    expect(quotes).toHaveLength(1);
    expect(quotes[0].symbol).toBe('AAPL');
    expect(quotes[0].price).toBe(175.24);
  });
});
```

---

### 8.3 End-to-End Tests (Real API or Staging)

**Purpose**: Test against actual V11 backend (staging environment)

**Example**:
```typescript
describe('E2E: V11 Backend Integration', () => {
  const v11Client = new V11BackendClient({
    baseUrl: process.env.V11_STAGING_URL || 'http://localhost:9003'
  });

  it('should connect to V11 backend and fetch real data', async () => {
    const health = await v11Client.getHealth();
    expect(health.success).toBe(true);

    const stats = await v11Client.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data.totalTransactions).toBeGreaterThan(0);
  });

  it('should establish WebSocket connection', async () => {
    const wsManager = new WebSocketManager({
      url: 'ws://localhost:9003/ws'
    });

    await wsManager.connect();

    return new Promise((resolve) => {
      wsManager.on('connected', () => {
        expect(wsManager.getState().connectionState).toBe('CONNECTED');
        wsManager.disconnect();
        resolve();
      });
    });
  });
});
```

---

## 9. Security Considerations

### 9.1 API Key Storage

#### Mobile (Flutter)
```dart
// Use flutter_secure_storage package
final storage = FlutterSecureStorage();

// Write
await storage.write(key: 'alpaca_api_key', value: apiKey);

// Read
final apiKey = await storage.read(key: 'alpaca_api_key');

// iOS: Stored in Keychain
// Android: Encrypted with AES via EncryptedSharedPreferences
```

#### Mobile (React Native)
```typescript
// Use react-native-keychain package
import * as Keychain from 'react-native-keychain';

// Write
await Keychain.setGenericPassword('alpaca_api_key', apiKey);

// Read
const credentials = await Keychain.getGenericPassword();
const apiKey = credentials.password;
```

#### Web (React)
```typescript
// Use environment variables (NEVER store in localStorage)
const apiKey = process.env.REACT_APP_ALPACA_API_KEY;

// For user-entered keys, store in memory only (not persisted)
class APIKeyManager {
  private keys: Record<string, string> = {};

  set(provider: string, key: string): void {
    this.keys[provider] = key;
  }

  get(provider: string): string | undefined {
    return this.keys[provider];
  }

  clear(): void {
    this.keys = {};
  }
}
```

---

### 9.2 HTTPS Enforcement

**Production Rule**: All API requests MUST use HTTPS/WSS

```typescript
class SecureAPIClient {
  constructor(baseUrl: string) {
    // In production, enforce HTTPS
    if (process.env.NODE_ENV === 'production' && !baseUrl.startsWith('https://')) {
      throw new Error('HTTPS required in production');
    }

    this.baseUrl = baseUrl;
  }
}
```

---

### 9.3 Certificate Pinning (Mobile Only)

**Purpose**: Prevent man-in-the-middle attacks

**Flutter**:
```dart
// Use certificate pinning via http_certificate_pinning package
final certificates = [
  '''-----BEGIN CERTIFICATE-----
  MIIDXTCCAkWgAwIBAgIJAKL...
  -----END CERTIFICATE-----'''
];

final client = HttpCertificatePinning(
  certificates: certificates,
  enablePinning: true,
);
```

**React Native**:
```typescript
// Use react-native-ssl-pinning package
import SSLPinning from 'react-native-ssl-pinning';

const response = await SSLPinning.fetch(url, {
  method: 'GET',
  pkPinning: true,
  sslPinning: {
    certs: ['cert1', 'cert2']
  }
});
```

---

## 10. Performance Optimization

### 10.1 Request Batching

**Purpose**: Reduce number of HTTP requests

**Example**: Fetch multiple stock quotes in one request
```typescript
// Instead of 8 separate requests:
const quotes = await Promise.all([
  alpacaClient.getQuote('AAPL'),
  alpacaClient.getQuote('GOOGL'),
  // ... 6 more
]);

// Batch into 1 request:
const quotes = await alpacaClient.getQuotes(['AAPL', 'GOOGL', 'MSFT', ...]);
```

---

### 10.2 Response Compression

**Method**: Enable gzip/brotli compression

**Client Configuration**:
```typescript
const response = await fetch(url, {
  headers: {
    'Accept-Encoding': 'gzip, deflate, br'
  }
});
```

---

### 10.3 Adaptive Polling

**Purpose**: Reduce polling frequency on slow devices or low battery

```typescript
class AdaptivePoller {
  private baseInterval = 1000;  // 1 second
  private currentInterval = 1000;

  async poll(callback: () => Promise<void>): Promise<void> {
    while (true) {
      const startTime = Date.now();

      await callback();

      const duration = Date.now() - startTime;

      // If callback takes >500ms, increase interval
      if (duration > 500) {
        this.currentInterval = Math.min(this.currentInterval * 1.5, 5000);
      } else {
        this.currentInterval = this.baseInterval;
      }

      await new Promise(resolve => setTimeout(resolve, this.currentInterval));
    }
  }
}
```

---

## 11. Monitoring and Logging

### 11.1 API Metrics Collection

**Metrics to Track**:
- Request count (per endpoint)
- Response time (average, p95, p99)
- Error rate (per endpoint)
- Cache hit rate
- WebSocket connection uptime
- Rate limit hits

**Implementation**:
```typescript
class APIMetricsCollector {
  private metrics = {
    requestCount: new Map<string, number>(),
    responseTimes: new Map<string, number[]>(),
    errorCount: new Map<string, number>(),
    cacheHits: 0,
    cacheMisses: 0
  };

  recordRequest(endpoint: string, responseTime: number, success: boolean): void {
    // Request count
    const count = this.metrics.requestCount.get(endpoint) || 0;
    this.metrics.requestCount.set(endpoint, count + 1);

    // Response times
    const times = this.metrics.responseTimes.get(endpoint) || [];
    times.push(responseTime);
    this.metrics.responseTimes.set(endpoint, times);

    // Error count
    if (!success) {
      const errors = this.metrics.errorCount.get(endpoint) || 0;
      this.metrics.errorCount.set(endpoint, errors + 1);
    }
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
    };
  }
}
```

---

### 11.2 Error Logging

**Purpose**: Track API errors for debugging

**Implementation**:
```typescript
class APIErrorLogger {
  async logError(context: {
    endpoint: string;
    method: string;
    statusCode?: number;
    error: Error;
    timestamp: Date;
  }): Promise<void> {
    console.error('[API Error]', {
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Send to error tracking service (Firebase Crashlytics, Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // await errorTrackingService.log(context);
    }
  }
}
```

---

## 12. Deployment Checklist

### 12.1 Pre-deployment Validation

- [ ] All API endpoints tested with integration tests
- [ ] Demo mode works offline (no API keys required)
- [ ] Live mode connects to V11 backend successfully
- [ ] WebSocket reconnection logic tested
- [ ] Rate limiting tested (doesn't exceed API limits)
- [ ] Error handling tested (all error scenarios)
- [ ] HTTPS/WSS enforced in production
- [ ] API keys stored securely (Keychain/EncryptedSharedPreferences)
- [ ] Certificate pinning configured (mobile only)
- [ ] Caching works correctly (respects TTL)
- [ ] Metrics collection working

### 12.2 Production Configuration

```typescript
const productionConfig = {
  v11Backend: {
    baseUrl: 'https://api.aurigraph.io',
    wsUrl: 'wss://api.aurigraph.io/ws',
    timeout: 30000,
    retryAttempts: 3
  },
  alpaca: {
    endpoint: 'https://data.alpaca.markets/v2',
    rateLimit: 200
  },
  openweathermap: {
    endpoint: 'https://api.openweathermap.org/data/2.5',
    rateLimit: 60
  },
  twitter: {
    endpoint: 'https://api.twitter.com/2',
    rateLimit: 15
  },
  enforceHTTPS: true,
  enableCertificatePinning: true,
  cacheEnabled: true
};
```

---

## 13. Success Criteria

### API Integration Acceptance Criteria

✅ V11 Backend REST API integration complete (all 15+ endpoints)
✅ V11 Backend WebSocket integration complete (subscribe, reconnect, fallback)
✅ Alpaca Markets API integration complete (demo mode + live mode)
✅ OpenWeatherMap API integration complete (demo mode + live mode)
✅ X.com API integration complete (demo mode + live mode)
✅ Error handling implemented (retry, fallback, user-friendly messages)
✅ Rate limiting implemented (all APIs respect limits)
✅ Caching implemented (appropriate TTLs)
✅ Demo mode works offline (no API dependencies)
✅ Security implemented (HTTPS, secure storage, certificate pinning on mobile)
✅ Testing complete (unit tests, integration tests, E2E tests)
✅ Monitoring and logging implemented
✅ Performance optimized (request batching, compression, adaptive polling)

---

## 14. Next Steps

**Completed**:
- ✅ Task 1.1.3: API Integration Planning (this document)

**Next Tasks**:
- 🔄 Task 1.2.1: Enterprise Portal Integration Architecture
- 🔄 Task 1.2.2: Mobile App Architecture
- 🔄 Task 1.2.3: Database Schema Design
- 🔄 Task 1.3.1: Confirm Technology Stack

---

**Document Status**: ✅ Complete
**Prepared by**: Claude Code (Aurigraph DLT Development Team)
**Date**: October 9, 2025
**Version**: 1.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)
