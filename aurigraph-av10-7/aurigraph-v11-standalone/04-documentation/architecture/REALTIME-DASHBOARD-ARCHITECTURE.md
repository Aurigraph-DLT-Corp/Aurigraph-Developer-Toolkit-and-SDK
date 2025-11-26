# Aurigraph V11 Real-Time Dashboard Architecture
**Date**: October 6, 2025
**Requirement**: All API endpoints must have real-time dashboards
**Framework**: Hybrid approach - Vizro + React + WebSockets

---

## Dashboard Technology Stack

### Primary Framework Options

#### Option 1: **Vizro by McKinsey** (Recommended for Analytics)
- **Language**: Python
- **Strengths**:
  - Low-code dashboard creation
  - Built on Plotly Dash
  - AI-powered insights
  - Automatic chart recommendations
- **Use Cases**:
  - Analytics dashboards (Sprint 14)
  - Business intelligence views
  - Executive reporting
- **Integration**: Python microservice + REST API bridge

#### Option 2: **React + Recharts + WebSockets** (Recommended for Real-Time)
- **Language**: TypeScript/React (already in use)
- **Strengths**:
  - Real-time updates via WebSocket
  - Material-UI integration (current stack)
  - Low latency (<100ms)
  - Custom visualizations
- **Use Cases**:
  - Transaction monitoring (Sprint 9)
  - Block explorer (Sprint 9)
  - Node health (Sprint 9)
  - Channel metrics (Sprint 10)
- **Integration**: Direct WebSocket to backend

#### Option 3: **Apache Superset** (Best for Ad-Hoc Queries)
- **Language**: Python + React
- **Strengths**:
  - SQL-based dashboards
  - Chart builder UI
  - Role-based access
- **Use Cases**:
  - Custom reports
  - Data exploration
- **Integration**: PostgreSQL connector

#### Option 4: **Grafana** (Best for Infrastructure Metrics)
- **Language**: Go + React
- **Strengths**:
  - Time-series visualization
  - Alerting system
  - Plugin ecosystem
- **Use Cases**:
  - System performance (Sprint 14)
  - Infrastructure monitoring
  - Consensus metrics
- **Integration**: Prometheus exporter

---

## Recommended Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   User Interface Layer                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │ React Dashboards │  │  Vizro Analytics │  │  Grafana   ││
│  │  (Real-Time)     │  │  (Business Intel)│  │ (Infra)    ││
│  │                  │  │                  │  │            ││
│  │ - Transactions   │  │ - Reports        │  │ - Metrics  ││
│  │ - Blocks         │  │ - Trends         │  │ - Alerts   ││
│  │ - Channels       │  │ - Forecasts      │  │ - Logs     ││
│  │ - Contracts      │  │ - Insights       │  │ - Health   ││
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬──────┘│
│           │                     │                   │       │
└───────────┼─────────────────────┼───────────────────┼───────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│              Real-Time Data Streaming Layer               │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │  WebSocket  │  │   REST API  │  │  Prometheus  │      │
│  │   Server    │  │   Gateway   │  │   Exporter   │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘      │
│         │                │                 │               │
└─────────┼────────────────┼─────────────────┼───────────────┘
          │                │                 │
          ▼                ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│              Aurigraph V11 Backend Services                │
├────────────────────────────────────────────────────────────┤
│  TransactionService | BlockService | ChannelService        │
│  ContractService | TokenService | MetricsCollector         │
└────────────────────────────────────────────────────────────┘
```

---

## Real-Time Dashboard Requirements by Sprint

### Sprint 9: Core Blockchain Dashboards

#### Dashboard 1: **Transaction Monitor** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/transactions`
**Technology**: React + Recharts + WebSocket
**Update Frequency**: Real-time (every transaction)

**Visualizations**:
- Live transaction feed (streaming list)
- TPS gauge (current, average, peak)
- Transaction type distribution (pie chart)
- Transaction status flow (confirmed/pending/failed)
- Gas price heatmap
- Transaction volume trend (line chart, 24h)

**Metrics**:
- Current TPS
- Average confirmation time
- Pending pool size
- Failed transaction rate
- Total transaction count (today)

**Files to Create**:
- `TransactionWebSocketService.java` - WebSocket handler
- `TransactionMonitorDashboard.tsx` - React dashboard
- `TransactionStreamingAPI.java` - Streaming API

---

#### Dashboard 2: **Block Explorer** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/blocks`
**Technology**: React + D3.js + WebSocket
**Update Frequency**: Every new block (~3s)

**Visualizations**:
- Latest blocks table (live updates)
- Block size trend (area chart)
- Block time distribution (histogram)
- Merkle tree visualization
- Validator distribution (network graph)
- Fork detection alerts

**Metrics**:
- Current block height
- Average block time
- Block size (current/average)
- Transactions per block
- Active validators

**Files to Create**:
- `BlockWebSocketService.java` - WebSocket handler
- `BlockExplorerDashboard.tsx` - React dashboard
- `BlockStreamingAPI.java` - Streaming API

---

#### Dashboard 3: **Node Health Monitor** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/nodes`
**Technology**: React + Recharts + WebSocket
**Update Frequency**: Every 10 seconds

**Visualizations**:
- Node status map (geographical if available)
- Node health scores (gauge cluster)
- Consensus participation rate
- Network topology graph (force-directed)
- Node uptime timeline
- Bandwidth usage (stacked area)

**Metrics**:
- Total nodes (active/inactive)
- Consensus participation %
- Average node latency
- Network coverage
- Validator count

**Files to Create**:
- `NodeWebSocketService.java` - WebSocket handler
- `NodeHealthDashboard.tsx` - React dashboard
- `NodeMetricsCollector.java` - Metrics collector

---

### Sprint 10: Channel & Multi-Ledger Dashboards

#### Dashboard 4: **Channel Performance Monitor** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/channels`
**Technology**: React + Recharts + WebSocket
**Update Frequency**: Every 5 seconds

**Visualizations**:
- Channel TPS comparison (multi-line chart)
- Channel member activity heatmap
- Cross-channel transaction flow (Sankey diagram)
- Channel storage utilization
- Channel consensus metrics
- Privacy score indicators

**Metrics**:
- Active channels count
- Total channel TPS
- Isolated transaction count
- Cross-channel messages
- Channel member count

**Files to Create**:
- `ChannelWebSocketService.java` - WebSocket handler
- `ChannelPerformanceDashboard.tsx` - React dashboard
- `ChannelMetricsAggregator.java` - Metrics aggregation

---

### Sprint 11: Smart Contract Dashboards

#### Dashboard 5: **Contract Execution Monitor** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/contracts`
**Technology**: React + Recharts + WebSocket
**Update Frequency**: Real-time (every execution)

**Visualizations**:
- Live contract executions (streaming table)
- Gas usage by contract (treemap)
- Contract call graph (network diagram)
- Execution success/failure rate (donut chart)
- Popular contracts (bar chart, top 10)
- Contract state changes (timeline)

**Metrics**:
- Total contracts deployed
- Active contracts (24h)
- Total executions (today)
- Average gas per execution
- Failed execution rate

**Files to Create**:
- `ContractWebSocketService.java` - WebSocket handler
- `ContractExecutionDashboard.tsx` - React dashboard
- `ContractAnalyticsService.java` - Analytics engine

---

#### Dashboard 6: **Security Audit Dashboard** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/security`
**Technology**: React + Plotly + WebSocket
**Update Frequency**: On-demand + continuous monitoring

**Visualizations**:
- Vulnerability severity distribution
- Audit status pipeline (funnel chart)
- Security score trends (line chart)
- Compliance violations (alert cards)
- Code coverage heatmap
- Attack surface analysis

**Metrics**:
- Verified contracts %
- Critical vulnerabilities
- Compliance score
- Audited contracts count
- Failed audits

**Files to Create**:
- `SecurityWebSocketService.java` - WebSocket handler
- `SecurityAuditDashboard.tsx` - React dashboard
- `ContractSecurityScanner.java` - Security scanner

---

### Sprint 12: Token & RWA Dashboards

#### Dashboard 7: **Token Analytics Dashboard** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/tokens`
**Technology**: React + Recharts + WebSocket
**Update Frequency**: Every 30 seconds

**Visualizations**:
- Token supply distribution (pie chart)
- Minting/burning activity (area chart)
- Top token holders (bar chart)
- Token transfer velocity (line chart)
- RWA tokenization flow (Sankey)
- NFT marketplace activity

**Metrics**:
- Total tokens issued
- Total supply (all tokens)
- RWA tokens count
- NFT count
- Token transfers (24h)

**Files to Create**:
- `TokenWebSocketService.java` - WebSocket handler
- `TokenAnalyticsDashboard.tsx` - React dashboard
- `TokenMetricsCollector.java` - Metrics collector

---

#### Dashboard 8: **RWA Valuation Dashboard** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/rwa/oracle`
**Technology**: Vizro + Plotly
**Update Frequency**: Every 5 minutes (oracle refresh)

**Visualizations**:
- Oracle price feeds (multi-source comparison)
- Asset valuation trends (time-series)
- Price deviation alerts
- Oracle consensus status
- Asset type distribution
- Valuation accuracy metrics

**Metrics**:
- Total RWA value locked
- Oracle uptime %
- Price update frequency
- Consensus deviation
- Asset categories

**Files to Create**:
- `OracleWebSocketService.java` - WebSocket handler
- `RWAValuationDashboard.py` - Vizro dashboard
- `OraclePriceFeedAggregator.java` - Price aggregation

---

### Sprint 13: Active Contracts & DeFi Dashboards

#### Dashboard 9: **Active Contracts Workflow** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/activecontracts`
**Technology**: React + D3.js + WebSocket
**Update Frequency**: Real-time (every state change)

**Visualizations**:
- Contract workflow state machine
- Triple-entry ledger balance sheet
- Legal clause activation timeline
- Signatory approval progress
- Contract milestone tracking
- Compliance checkpoint status

**Metrics**:
- Active contracts count
- Pending signatures
- Completed milestones
- Compliance violations
- Execution rate

**Files to Create**:
- `ActiveContractWebSocketService.java` - WebSocket handler
- `ActiveContractWorkflowDashboard.tsx` - React dashboard
- `TripleEntryVisualization.tsx` - Ledger visualization

---

#### Dashboard 10: **DeFi Integration Dashboard** (Real-Time)
**Endpoint**: `wss://dlt.aurigraph.io/ws/defi`
**Technology**: React + Recharts + WebSocket
**Update Frequency**: Every 15 seconds

**Visualizations**:
- DEX liquidity pools (treemap)
- Lending/borrowing rates (multi-line chart)
- Yield farming APY comparison
- Impermanent loss calculator
- Protocol TVL breakdown
- Cross-protocol arbitrage opportunities

**Metrics**:
- Total Value Locked (TVL)
- Active liquidity pools
- Total borrowed amount
- Average APY
- Protocol integration count

**Files to Create**:
- `DeFiWebSocketService.java` - WebSocket handler
- `DeFiIntegrationDashboard.tsx` - React dashboard
- `DeFiMetricsAggregator.java` - Metrics aggregation

---

### Sprint 14: Analytics & System Dashboards

#### Dashboard 11: **Business Intelligence** (AI-Powered)
**Endpoint**: REST + batch analytics
**Technology**: **Vizro** (Primary)
**Update Frequency**: Every 1 hour

**Visualizations**:
- Predictive transaction volume (AI forecast)
- User behavior clustering (ML segmentation)
- Revenue trend analysis
- Network growth projections
- Anomaly detection alerts
- Automated insights (natural language)

**Metrics**:
- Monthly active users
- Revenue (transaction fees)
- Network growth rate
- Churn prediction
- Lifetime value

**Files to Create**:
- `BusinessIntelligenceDashboard.py` - Vizro dashboard
- `AIAnalyticsService.java` - AI analytics backend
- `PredictiveModelService.java` - ML model serving

---

#### Dashboard 12: **System Health & Infrastructure** (Real-Time)
**Endpoint**: Prometheus metrics
**Technology**: **Grafana**
**Update Frequency**: Every 5 seconds

**Visualizations**:
- CPU/Memory/Disk usage (time-series)
- JVM heap usage (area chart)
- Database connection pool
- API response time (histogram)
- Error rate by endpoint
- Consensus algorithm performance

**Metrics**:
- System uptime
- API latency (p50, p95, p99)
- Error rate
- Database query time
- Cache hit ratio

**Files to Create**:
- `PrometheusMetricsExporter.java` - Metrics exporter
- Grafana JSON dashboards (config files)
- Alert rules configuration

---

## Implementation Plan

### Phase 1: WebSocket Infrastructure (Sprint 9, Week 1)
**JIRA**: AV11-067 (5 points)

**Tasks**:
1. Create `WebSocketManager.java` - Central WebSocket orchestrator
2. Implement `RealtimeDataStreamer.java` - Data streaming service
3. Add Quarkus WebSocket dependency to `pom.xml`
4. Create WebSocket authentication/authorization
5. Implement rate limiting and backpressure handling

**Files to Create**:
```java
// WebSocketManager.java
@ServerEndpoint("/ws/{category}")
@ApplicationScoped
public class WebSocketManager {
    private final Map<String, Set<Session>> subscribers = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("category") String category) {
        // Subscribe to category (transactions, blocks, nodes, etc.)
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        // Handle subscription filters
    }

    public void broadcast(String category, String data) {
        // Broadcast to all subscribers
    }
}
```

---

### Phase 2: React Dashboard Framework (Sprint 9, Week 2)
**JIRA**: AV11-068 (3 points)

**Tasks**:
1. Create `RealtimeDashboardProvider.tsx` - WebSocket context
2. Implement `useRealtimeData()` - Custom React hook
3. Create `DashboardLayout.tsx` - Unified dashboard layout
4. Add real-time chart components library
5. Implement error handling and reconnection logic

**Files to Create**:
```typescript
// useRealtimeData.ts
export function useRealtimeData<T>(endpoint: string, filters?: object): {
  data: T[],
  loading: boolean,
  error: Error | null,
  latency: number
} {
  const [data, setData] = useState<T[]>([]);
  const ws = useWebSocket(`wss://dlt.aurigraph.io${endpoint}`);

  useEffect(() => {
    ws.on('message', (newData: T) => {
      setData(prev => [...prev, newData].slice(-1000)); // Keep last 1000
    });
  }, []);

  return { data, loading, error, latency: ws.latency };
}
```

---

### Phase 3: Vizro Integration (Sprint 14)
**JIRA**: AV11-069 (8 points)

**Tasks**:
1. Set up Vizro Python microservice
2. Create API bridge: Quarkus ↔ Vizro
3. Implement dashboard templates
4. Configure automatic insights
5. Deploy Vizro to `/vizro/` path

**Architecture**:
```
┌──────────────────┐
│  React Portal    │
│  (port 443)      │
└────────┬─────────┘
         │
    ┌────▼────────────────┐
    │  NGINX Reverse      │
    │  Proxy              │
    ├─────────────────────┤
    │ /portal/  → React   │
    │ /api/v11/ → Quarkus │
    │ /vizro/   → Vizro   │
    │ /grafana/ → Grafana │
    └─────────────────────┘
         │    │     │
    ┌────▼────▼─────▼────┐
    │  Port 8443: Quarkus│
    │  Port 8050: Vizro  │
    │  Port 3000: Grafana│
    └────────────────────┘
```

---

### Phase 4: Grafana Setup (Sprint 14)
**JIRA**: AV11-070 (3 points)

**Tasks**:
1. Deploy Grafana container
2. Configure Prometheus data source
3. Import pre-built Quarkus dashboards
4. Create custom Aurigraph dashboards
5. Set up alerting rules

---

## Updated Sprint Allocations (With Dashboards)

### Sprint 9: Core Blockchain APIs + Dashboards (18 points)
- Transaction APIs (5 points)
- Block APIs (3 points)
- Node APIs (5 points)
- **WebSocket Infrastructure (5 points)** ← NEW
- **Transaction Monitor Dashboard (3 points)** ← NEW
- **Block Explorer Dashboard (3 points)** ← NEW
- **Node Health Dashboard (3 points)** ← NEW

**Total**: 27 points (split into 2 sprints if needed)

---

### Sprint 10: Channels + Dashboards (18 points)
- Channel Management APIs (8 points)
- Portal Channel Integration (5 points)
- **Channel Performance Dashboard (5 points)** ← NEW

---

### Sprint 11: Contracts + Dashboards (18 points)
- Contract APIs (8 points)
- Portal Contract Integration (5 points)
- **Contract Execution Dashboard (3 points)** ← NEW
- **Security Audit Dashboard (2 points)** ← NEW

---

### Sprint 12: Tokens + Dashboards (18 points)
- Token APIs (8 points)
- Portal Token Integration (5 points)
- **Token Analytics Dashboard (3 points)** ← NEW
- **RWA Valuation Dashboard (Vizro) (2 points)** ← NEW

---

### Sprint 13: Active Contracts + DeFi Dashboards (18 points)
- Active Contract APIs (8 points)
- Portal Active Contract Integration (5 points)
- **Active Contract Workflow Dashboard (3 points)** ← NEW
- **DeFi Integration Dashboard (2 points)** ← NEW

---

### Sprint 14: Analytics + System Dashboards (20 points)
- Analytics APIs (5 points)
- System APIs (5 points)
- Auth APIs (5 points)
- **Vizro Business Intelligence (8 points)** ← NEW
- **Grafana Infrastructure Monitoring (3 points)** ← NEW

---

## Dashboard Technology Matrix

| Dashboard | Technology | Update Frequency | Complexity | Sprint |
|-----------|-----------|------------------|------------|--------|
| Transaction Monitor | React + WebSocket | Real-time | Medium | 9 |
| Block Explorer | React + D3 + WebSocket | 3s | High | 9 |
| Node Health | React + WebSocket | 10s | Medium | 9 |
| Channel Performance | React + WebSocket | 5s | Medium | 10 |
| Contract Execution | React + WebSocket | Real-time | High | 11 |
| Security Audit | React + Plotly | On-demand | High | 11 |
| Token Analytics | React + WebSocket | 30s | Medium | 12 |
| RWA Valuation | Vizro + Plotly | 5min | High | 12 |
| Active Contract Flow | React + D3 | Real-time | High | 13 |
| DeFi Integration | React + WebSocket | 15s | Medium | 13 |
| Business Intelligence | Vizro (AI) | 1h | Very High | 14 |
| Infrastructure | Grafana | 5s | Low | 14 |

---

## Performance Requirements

### WebSocket Performance
- **Latency**: <100ms (client to server)
- **Throughput**: 10,000 messages/second per endpoint
- **Concurrent Connections**: 1,000+ simultaneous users
- **Message Size**: <10KB per message
- **Compression**: gzip enabled

### Dashboard Rendering
- **First Paint**: <500ms
- **Time to Interactive**: <2s
- **Frame Rate**: 60 FPS
- **Data Points**: Up to 10,000 per chart
- **Auto-refresh**: Configurable (5s - 1h)

---

## Security & Access Control

### Dashboard Access Levels
1. **Public**: Block explorer, transaction monitor (read-only)
2. **User**: Token analytics, contract execution (authenticated)
3. **Admin**: Node health, security audit, system dashboards
4. **Super Admin**: Business intelligence, Grafana, all metrics

### WebSocket Security
- JWT authentication required
- Rate limiting: 100 messages/minute per user
- IP-based firewall rules
- TLS 1.3 encryption mandatory

---

**Next Steps**:
1. Implement WebSocket infrastructure (Sprint 9, Week 1)
2. Create Transaction Monitor dashboard (Sprint 9, Week 2)
3. Deploy Vizro microservice (Sprint 14)
4. Configure Grafana (Sprint 14)

**Contact**: subbu@aurigraph.io
**Dashboard Demo**: Coming in Sprint 9 (Oct 18, 2025)

🤖 Generated with Claude Code
