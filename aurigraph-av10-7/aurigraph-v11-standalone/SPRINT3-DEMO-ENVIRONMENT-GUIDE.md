# Aurigraph V11 - Sprint 3: Demo Environment Guide

## Overview
This guide documents the demo environment setup for Sprint 3, covering WebSocket real-time streaming, transaction generation, performance metrics, and benchmarking capabilities.

---

## Demo Components

### 1. WebSocket Real-time Streaming (AV11-67)

#### Endpoint Configuration
- **WebSocket URL**: `wss://dlt.aurigraph.io/ws/stream`
- **Local Development**: `ws://localhost:9003/ws/stream`

#### Features
- Real-time transaction streaming
- Block creation notifications
- Consensus status updates
- Performance metrics streaming

#### Usage Example
```javascript
const ws = new WebSocket('wss://dlt.aurigraph.io/ws/stream');

ws.onopen = () => {
    console.log('Connected to Aurigraph V11 WebSocket');
    // Subscribe to transaction stream
    ws.send(JSON.stringify({ action: 'subscribe', channel: 'transactions' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Transaction:', data);
};

ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
};
```

#### Available Channels
- `transactions` - Real-time transaction updates
- `blocks` - New block notifications
- `consensus` - Consensus round updates
- `metrics` - Performance metrics stream
- `alerts` - System alert notifications

---

### 2. Transaction Generation Engine (AV11-68)

#### API Endpoints
```
POST /api/v11/demo/generate
POST /api/v11/demo/batch
GET  /api/v11/demo/status
POST /api/v11/demo/stop
```

#### Transaction Types
| Type | Description | Payload Example |
|------|-------------|-----------------|
| TRANSFER | Token transfers | `{"type":"TRANSFER","from":"addr1","to":"addr2","amount":100}` |
| STAKE | Staking operations | `{"type":"STAKE","validator":"val1","amount":1000}` |
| BRIDGE | Cross-chain transfers | `{"type":"BRIDGE","chain":"ethereum","amount":50}` |
| CONTRACT | Smart contract calls | `{"type":"CONTRACT","contract":"0x...","method":"transfer"}` |

#### Generate Transactions (cURL)
```bash
# Single transaction
curl -X POST https://dlt.aurigraph.io/api/v11/demo/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TRANSFER",
    "count": 1,
    "config": {
      "from": "demo-sender",
      "to": "demo-receiver",
      "amount": 100
    }
  }'

# Batch generation with specific TPS
curl -X POST https://dlt.aurigraph.io/api/v11/demo/batch \
  -H "Content-Type: application/json" \
  -d '{
    "targetTps": 10000,
    "duration": 60,
    "transactionMix": {
      "TRANSFER": 70,
      "STAKE": 15,
      "BRIDGE": 10,
      "CONTRACT": 5
    }
  }'

# Check generation status
curl https://dlt.aurigraph.io/api/v11/demo/status

# Stop generation
curl -X POST https://dlt.aurigraph.io/api/v11/demo/stop
```

#### TPS Rate Options
- **Low**: 1,000 TPS - Basic functionality demo
- **Medium**: 10,000 TPS - Standard load demo
- **High**: 100,000 TPS - Performance showcase
- **Ultra**: 1,000,000+ TPS - Maximum throughput demo

---

### 3. Performance Metrics Collection (AV11-69)

#### Prometheus Metrics Endpoint
```
GET /q/metrics
```

#### Key Metrics Available

##### Transaction Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `aurigraph_transactions_processed_total` | Counter | Total transactions processed |
| `aurigraph_transactions_failed_total` | Counter | Failed transactions |
| `aurigraph_transaction_duration_seconds` | Histogram | Transaction processing time |
| `aurigraph_transaction_queue_size` | Gauge | Pending transactions in queue |

##### Consensus Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `aurigraph_consensus_rounds_total` | Counter | Consensus rounds completed |
| `aurigraph_consensus_leader_id` | Gauge | Current leader node ID |
| `aurigraph_consensus_cluster_size` | Gauge | Active cluster nodes |
| `aurigraph_consensus_latency_seconds` | Histogram | Consensus round latency |

##### System Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `jvm_memory_used_bytes` | Gauge | JVM memory usage |
| `jvm_gc_pause_seconds` | Summary | GC pause duration |
| `process_cpu_usage` | Gauge | CPU utilization |

#### Grafana Dashboards

Access Grafana at: `http://dlt.aurigraph.io:3000`
- **Username**: admin
- **Password**: Configured via `GRAFANA_PASSWORD` env var

##### Available Dashboards
1. **Aurigraph V11 Overview** - Main system dashboard
2. **Transaction Performance** - TPS, latency, error rates
3. **Consensus Monitoring** - HyperRAFT++ status
4. **Infrastructure Health** - CPU, memory, disk
5. **Cross-Chain Bridge** - Bridge transaction status

---

### 4. Performance Benchmarking Suite (AV11-72)

#### Benchmark Script Location
```bash
/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/05-deployment/scripts/demo-performance-tests.sh
```

#### Running Benchmarks
```bash
# Full benchmark suite (21 tests)
./05-deployment/scripts/demo-performance-tests.sh

# Quick smoke test
./05-deployment/scripts/demo-perf-simple.sh

# Sprint 4 validation suite
./05-deployment/scripts/sprint4-validation-suite.sh
```

#### Test Categories

##### Category 1: API Response Time Tests (5 tests)
- GET /api/demos response time < 500ms
- POST /api/demos response time < 1000ms
- GET /api/demos/{id} response time < 200ms
- PUT /api/demos/{id} response time < 500ms
- DELETE /api/demos/{id} response time < 500ms

##### Category 2: Throughput & Scalability Tests (5 tests)
- Handle 10 concurrent users
- Handle 50 concurrent users
- Measure requests/second under load (target: 20+ req/s)
- Average response time under load < 1000ms
- System stability (100 mixed operations)

##### Category 3: Database Performance Tests (5 tests)
- CREATE operation < 100ms
- SELECT operation < 50ms
- UPDATE operation < 100ms
- DELETE operation < 100ms
- SELECT with filter < 100ms

##### Category 4: Memory & Resource Tests (3 tests)
- JVM memory usage < 512MB (dev mode)
- CPU utilization under load < 80%
- Response time stability (< 20% degradation)

##### Category 5: Stress & Endurance Tests (3 tests)
- 100 sequential demo creations (99% success)
- 5-minute sustained load (95% success)
- Peak concurrent load (100 simultaneous requests)

#### Benchmark Report Output
```
Report File: ./performance-reports/demo_performance_report_<timestamp>.txt
JSON File: ./performance-reports/demo_performance_results_<timestamp>.json
```

---

## Demo Scenarios

### Scenario 1: Live Transaction Streaming Demo
**Duration**: 5 minutes

1. Open WebSocket connection in demo page
2. Start transaction generator at 10,000 TPS
3. Watch real-time transaction flow
4. Show Grafana dashboard with live metrics
5. Demonstrate consensus round completion

### Scenario 2: High-Throughput Performance Demo
**Duration**: 10 minutes

1. Show baseline metrics in Grafana
2. Start transaction generator at 100K TPS
3. Observe TPS counter increasing
4. Display P99 latency metrics
5. Show error rate (target: < 0.1%)
6. Gradually increase to 1M TPS

### Scenario 3: Cross-Chain Bridge Demo
**Duration**: 5 minutes

1. Show supported chains (Ethereum, Polygon, BSC, Avalanche, Solana)
2. Generate bridge transactions
3. Monitor bridge queue status
4. Display validator confirmations
5. Show transaction finality

### Scenario 4: Quantum Cryptography Demo
**Duration**: 3 minutes

1. Explain CRYSTALS-Dilithium signatures
2. Show signature verification metrics
3. Demonstrate post-quantum security level (NIST Level 5)

---

## Quick Start Commands

### Start Local Demo Environment
```bash
# Start with docker-compose
docker-compose -f docker-compose.yml up -d

# Wait for startup
sleep 30

# Verify services
curl http://localhost:9003/q/health

# Access Enterprise Portal
open http://localhost:9003
```

### Access Demo Page
```
Local: http://localhost:9003/demo.html
Production: https://dlt.aurigraph.io/demo.html
```

### Generate Demo Traffic
```bash
# Quick 1-minute demo load
curl -X POST http://localhost:9003/api/v11/demo/batch \
  -H "Content-Type: application/json" \
  -d '{"targetTps": 1000, "duration": 60}'
```

### Check System Status
```bash
# Health status
curl http://localhost:9003/q/health | jq .

# Performance stats
curl http://localhost:9003/api/v11/stats | jq .

# Prometheus metrics
curl http://localhost:9003/q/metrics | grep aurigraph
```

---

## Troubleshooting

### WebSocket Connection Issues
```bash
# Check WebSocket endpoint
wscat -c ws://localhost:9003/ws/stream

# Verify NGINX WebSocket config
nginx -t
```

### Transaction Generation Not Starting
```bash
# Check generator status
curl http://localhost:9003/api/v11/demo/status

# View application logs
docker-compose logs -f aurigraph-v11-native | grep -i demo
```

### Metrics Not Appearing in Grafana
```bash
# Verify Prometheus targets
curl http://localhost:9090/api/v1/targets | jq .

# Check Prometheus scrape status
curl http://localhost:9090/api/v1/query?query=up
```

---

## Document Version
- **Created**: 2025-12-20
- **Sprint**: Sprint 3 - Production Deployment & Demo
- **Author**: DevOps & Deployment Agent (DDA)
