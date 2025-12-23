# COMPREHENSIVE AURIGRAPH DLT DEPLOYMENT GUIDE
**Version**: 11.4.4
**Last Updated**: November 19, 2025
**Status**: Production-Ready with J4C Agent Framework

---

## TABLE OF CONTENTS
1. [System Architecture Overview](#system-architecture-overview)
2. [Complete Service Inventory](#complete-service-inventory)
3. [Network & Port Configuration](#network--port-configuration)
4. [Enterprise Portal Integration](#enterprise-portal-integration)
5. [gRPC & Protocol Buffers (HTTP/2)](#grpc--protocol-buffers)
6. [Deployment Workflow](#deployment-workflow)
7. [Configuration Management](#configuration-management)
8. [Security Infrastructure](#security-infrastructure)
9. [Monitoring & Observability](#monitoring--observability)
10. [Database & State Management](#database--state-management)
11. [Disaster Recovery](#disaster-recovery)
12. [J4C Agent Framework Integration](#j4c-agent-framework-integration)

---

# SYSTEM ARCHITECTURE OVERVIEW

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AURIGRAPH DLT PLATFORM V11                         │
│                     (Hybrid V10/V11 Architecture)                        │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        ENTERPRISE PORTAL (React)                           │
│                    https://dlt.aurigraph.io (Port 443)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Dashboard    │  │ Blockchain   │  │ Analytics    │  │ Settings     │ │
│  │ Managers     │  │ Explorer     │  │ Reports      │  │ Admin Panel  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌────────────────────────────────────────────────────────────────────────────┐
│                   NGINX REVERSE PROXY & LOAD BALANCER                      │
│                   (TLS 1.3 Termination, HTTP/2 Support)                   │
│                          Ports: 80 (→443), 443                            │
├───────────────────────────────────┬───────────────────────────────────────┤
│  REST API Routing                 │  gRPC Service Routing                 │
│  /api/v11/* → Port 9003           │  → Port 9004 (HTTP/2)                │
│  /api/v11/blockchain/*            │  TransactionService                   │
│  /api/v11/transactions/*          │  ConsensusService                     │
│  /api/v11/consensus/*             │  NetworkService                       │
│  /api/v11/nodes/*                 │  BlockchainService                    │
│  /api/v11/bridge/*                │                                       │
│  /api/v11/rwa/*                   │                                       │
│  /api/v11/analytics/*             │                                       │
│  /api/v11/health                  │                                       │
│  /api/v11/metrics                 │                                       │
└───────────────────────────────────┴───────────────────────────────────────┘
                    ↙                          ↘
        ┌──────────────────────┐    ┌──────────────────────┐
        │  QUARKUS REST API    │    │  gRPC SERVER (HTTP/2)│
        │   Port 9003          │    │   Port 9004          │
        │  ┌────────────────┐  │    │  ┌────────────────┐  │
        │  │ REST Endpoints │  │    │  │ gRPC Services  │  │
        │  │ (Jackson JSON) │  │    │  │ (Protobuf)     │  │
        │  │ HTTP/2 capable │  │    │  │ Vert.x Tnsp.   │  │
        │  └────────────────┘  │    │  └────────────────┘  │
        │  ┌────────────────┐  │    │  ┌────────────────┐  │
        │  │ OpenAPI/Swagger│  │    │  │ Reactive       │  │
        │  │ Documentation  │  │    │  │ Streams (Mutiny)│  │
        │  └────────────────┘  │    │  └────────────────┘  │
        └──────────────────────┘    └──────────────────────┘
                ↓                               ↓
        ┌──────────────────────────────────────────────────┐
        │          CORE BLOCKCHAIN SERVICES                 │
        │                                                   │
        │  ┌────────────────────────────────────────────┐  │
        │  │  TransactionService (12 RPC Methods)      │  │
        │  │  ├─ submitTransaction() [RPC]             │  │
        │  │  ├─ batchSubmitTransactions() [RPC]       │  │
        │  │  ├─ getTransactionStatus() [RPC]          │  │
        │  │  ├─ streamTransactionEvents() [Stream]    │  │
        │  │  └─ ... (8 more methods)                  │  │
        │  └────────────────────────────────────────────┘  │
        │                                                   │
        │  ┌────────────────────────────────────────────┐  │
        │  │  ConsensusService (11 RPC Methods)        │  │
        │  │  ├─ proposeBlock() [RPC]                  │  │
        │  │  ├─ voteOnBlock() [RPC]                   │  │
        │  │  ├─ commitBlock() [RPC]                   │  │
        │  │  ├─ heartbeat() [RPC]                     │  │
        │  │  ├─ streamConsensusEvents() [Stream]      │  │
        │  │  ├─ HyperRAFT++ Algorithm                 │  │
        │  │  └─ ... (6 more methods)                  │  │
        │  └────────────────────────────────────────────┘  │
        │                                                   │
        │  ┌────────────────────────────────────────────┐  │
        │  │  NetworkService                           │  │
        │  │  ├─ Peer Management (25 mock peers)       │  │
        │  │  ├─ Node Communication                    │  │
        │  │  └─ Service Discovery Integration         │  │
        │  └────────────────────────────────────────────┘  │
        │                                                   │
        │  ┌────────────────────────────────────────────┐  │
        │  │  BlockchainService                        │  │
        │  │  ├─ Block Querying & Validation           │  │
        │  │  ├─ Chain History Management              │  │
        │  │  └─ State Root Verification               │  │
        │  └────────────────────────────────────────────┘  │
        └──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│         DATA LAYER & STATE MANAGEMENT                     │
├───────────────────────┬──────────────────────────────────┤
│  PostgreSQL 15        │  Redis 7 Cache                   │
│  ┌─────────────────┐  │  ┌────────────────────────────┐  │
│  │ Transactions    │  │  │ Session Storage            │  │
│  │ Blocks          │  │  │ Blockchain Cache           │  │
│  │ Accounts        │  │  │ Analytics Cache            │  │
│  │ RWA Registry    │  │  │ Network State              │  │
│  │ Metadata        │  │  │ TTL: 1min-2hrs            │  │
│  │ Flyway Migrate  │  │  │ Max Memory: 512MB          │  │
│  └─────────────────┘  │  └────────────────────────────┘  │
│  Port: 5432           │  Port: 6379                      │
│  Replicas: 1          │  Replicas: 1-3                   │
└───────────────────────┴──────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│         PER-NODE STATE (LevelDB Embedded)                │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Node 1: Consensus State + RAFT Logs              │    │
│  │ Node 2: Consensus State + RAFT Logs              │    │
│  │ Node N: Consensus State + RAFT Logs              │    │
│  │ Each Node: 256MB Cache, 64MB Write Buffer       │    │
│  └──────────────────────────────────────────────────┘    │
│  Location: /var/lib/aurigraph/leveldb/node-{id}/        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│       INFRASTRUCTURE & SUPPORT SERVICES                   │
├──────────────────────┬─────────────────────────────────┤
│  Service Discovery   │  Secrets Management              │
│  ┌────────────────┐  │  ┌──────────────────────────┐   │
│  │ Consul         │  │  │ HashiCorp Vault          │   │
│  │ Port: 8500     │  │  │ Port: 8200               │   │
│  │ DNS: 8600/udp  │  │  │ Encrypted Secrets        │   │
│  │ Health Checks  │  │  │ Auth Methods: Token      │   │
│  └────────────────┘  │  │ AppRole, Kubernetes      │   │
│                      │  │ Paths: /secret/blockchain/│   │
│                      │  └──────────────────────────┘   │
└──────────────────────┴─────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│       MONITORING & OBSERVABILITY STACK                    │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Prometheus  │   Grafana    │   Jaeger     │  ELK Stack │
│  Port: 9090  │  Port: 3000  │ Port: 16686  │   Logs     │
│  ┌──────────┐│┌────────────┐│┌──────────────┐│┌────────┐ │
│  │ Metrics  ││ │Dashboards ││ │Tracing      ││ │ES:9200 │ │
│  │Collection││ │Analysis   ││ │Correlation  ││ │Kibana  │ │
│  │15d store ││ │Alerts     ││ │Performance  ││ │5601    │ │
│  └──────────┘│└────────────┘│└──────────────┘│└────────┘ │
│  Scrape 15s  │ 4 Datasources│ Multi-protocol│ Fluentd   │
└──────────────┴──────────────┴──────────────┴────────────┘
```

---

# COMPLETE SERVICE INVENTORY

## Master Service List (ALL 23+ Services)

### TIER 1: CORE BLOCKCHAIN SERVICES (CRITICAL)

| Service | Container | Ports | Protocol | Purpose | Scale |
|---------|-----------|-------|----------|---------|-------|
| **V11 REST API** | quarkus:21-jre-alpine | 9003 | HTTP/2 | REST endpoints (JSON) | 1-3 |
| **V11 gRPC Server** | quarkus:21-jre-alpine | 9004 | gRPC/HTTP2 | Service-to-service RPC | 1-3 |
| **V11 Native Binary** | scratch + binary | 9003 | HTTP/2 | Native runtime (~256MB) | 1-3 |
| **Transaction Service** | embedded in V11 | 9004 | gRPC | 12 RPC methods | 1-3 |
| **Consensus Service** | embedded in V11 | 9004 | gRPC | HyperRAFT++ (11 methods) | 1-3 |
| **Network Service** | embedded in V11 | 9004 | gRPC | Peer management | 1-3 |
| **Blockchain Service** | embedded in V11 | 9004 | gRPC | Block queries | 1-3 |

**Deployment Notes**:
- All on HTTP/2 for performance
- gRPC requires HTTP/2 (NOT HTTP/1.1)
- REST API available for legacy clients
- Can run as native OR JVM (with JVM fallback)

### TIER 2: DATA LAYER (CRITICAL)

| Service | Container | Ports | Purpose | Persistence |
|---------|-----------|-------|---------|-------------|
| **PostgreSQL** | postgres:15-alpine | 5432 | Primary database | Persistent Volume |
| **Redis** | redis:7.2-alpine | 6379 | Cache + Sessions | Optional persistence |
| **LevelDB** | embedded per node | - | Per-node state | Persistent Volume |

**Database Initialization**:
- Flyway migrations auto-run on startup
- Hibernate ORM schema management
- Connection pooling: min 5, max 20
- Max lifetime: 30 minutes

### TIER 3: API GATEWAY & REVERSE PROXY (CRITICAL)

| Service | Container | Ports | Purpose |
|---------|-----------|-------|---------|
| **NGINX** | nginx:alpine | 80, 443 | TLS termination + Load balancing |
| **HAProxy** | haproxy:2.8 | 8082 | Alternative load balancer (optional) |

**NGINX Configuration** (MANDATORY for production):
```nginx
# HTTP/2 enabled on both REST and gRPC
http2_max_field_size 32k;
http2_max_header_size 64k;

# Upstream for REST API
upstream v11_rest {
    server localhost:9003;
}

# Upstream for gRPC (HTTP/2 only)
upstream v11_grpc {
    server localhost:9004 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;

    location /api/v11/ {
        proxy_pass http://v11_rest;
        proxy_http_version 1.1;
    }

    location /grpc/ {
        proxy_pass http://v11_grpc;
        proxy_http_version 2.0;  # CRITICAL: HTTP/2 for gRPC
        proxy_buffering off;
    }
}
```

### TIER 4: SERVICE DISCOVERY & SECRETS (REQUIRED)

| Service | Container | Ports | Purpose |
|---------|-----------|-------|---------|
| **Consul** | consul:latest | 8500, 8600/udp | Service registry + DNS |
| **HashiCorp Vault** | vault:latest | 8200 | Secrets management |

**Consul Health Checks**:
```hcl
service {
  name = "aurigraph-v11"
  port = 9003
  check {
    http = "http://localhost:9003/q/health"
    interval = "30s"
    timeout = "10s"
  }
}
```

### TIER 5: MONITORING & OBSERVABILITY

| Service | Container | Ports | Purpose | Retention |
|---------|-----------|-------|---------|-----------|
| **Prometheus** | prom/prometheus | 9090 | Metrics collection | 15 days |
| **Grafana** | grafana/grafana | 3000 | Visualization | - |
| **Jaeger** | jaegertracing/all-in-one | 16686, 14250, 14268 | Distributed tracing | 72 hours |
| **Elasticsearch** | docker.elastic.co/elasticsearch/elasticsearch | 9200, 9300 | Log storage | 30 days |
| **Kibana** | docker.elastic.co/kibana/kibana | 5601 | Log visualization | - |
| **Logstash** | docker.elastic.co/logstash/logstash | 5000, 5044, 9600 | Log processing | - |
| **Fluentd** | fluent/fluentd | 24224 | Log collector | - |

**Scrape Configuration**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurigraph-v11'
    static_configs:
      - targets: ['localhost:9003']
    metrics_path: '/q/metrics'
```

### TIER 6: ENTERPRISE PORTAL

| Service | Container | Ports | Purpose |
|---------|-----------|-------|---------|
| **React Frontend** | node:20-alpine | 3000 | Web UI + Dashboards |
| **API Proxy** | embedded in React | 3000 | API request routing |

**Portal Architecture**:
```
Enterprise Portal (React)
    ↓
Axios HTTP Client
    ↓
Request Routing:
├─ REST API calls → NGINX → Port 9003
├─ gRPC calls → Envoy/gRPC Gateway → Port 9004
├─ Health checks → Port 9003/q/health
└─ Metrics → Prometheus → Port 9090
```

### TIER 7: OPTIONAL/SPECIALIZED SERVICES

| Service | Container | Ports | Purpose | When Used |
|---------|-----------|-------|---------|-----------|
| **Node Exporter** | prom/node-exporter | 9100, 9005 | System metrics | Always (monitoring) |
| **cAdvisor** | gcr.io/cadvisor/cadvisor | 8080 | Container metrics | Kubernetes deployments |
| **AlertManager** | prom/alertmanager | 8081 | Alert management | Production |
| **Kafka** | confluentinc/cp-kafka | 9092 | Event streaming | Phase 3+ |
| **NATS** | nats:latest | 4222 | Consensus messages | Phase 3+ |

---

# NETWORK & PORT CONFIGURATION

## Complete Port Assignment Map

### REST API Ports (HTTP/2)
```
Port 9003 - Aurigraph V11 REST API
├─ /api/v11/health                     [Health check]
├─ /api/v11/metrics                    [Prometheus metrics]
├─ /api/v11/stats                      [System statistics]
├─ /api/v11/nodes                      [Node management]
├─ /api/v11/blockchain/                [Blockchain queries]
│  ├─ /blockchain/transactions          [Get transactions]
│  ├─ /blockchain/blocks               [Get blocks]
│  ├─ /blockchain/accounts             [Get accounts]
│  ├─ /blockchain/state                [State queries]
│  └─ /blockchain/validators           [Validator info]
├─ /api/v11/transactions/              [Transaction service]
│  ├─ /transactions/submit             [POST submit]
│  ├─ /transactions/batch              [POST batch submit]
│  ├─ /transactions/{id}               [GET status]
│  ├─ /transactions/{id}/receipt       [GET receipt]
│  └─ /transactions/history            [GET history]
├─ /api/v11/consensus/                 [Consensus service]
│  ├─ /consensus/state                 [Get state]
│  ├─ /consensus/validators            [Get validators]
│  ├─ /consensus/metrics               [Get metrics]
│  └─ /consensus/leader                [Get leader]
├─ /api/v11/bridge/                    [Cross-chain bridge]
│  ├─ /bridge/chains                   [Get supported chains]
│  ├─ /bridge/transfer                 [POST transfer]
│  ├─ /bridge/status                   [GET status]
│  └─ /bridge/history                  [GET history]
├─ /api/v11/rwa/                       [Real-world assets]
│  ├─ /rwa/tokens                      [Get RWA tokens]
│  ├─ /rwa/tokenize                    [POST tokenize]
│  ├─ /rwa/verify                      [Verify asset]
│  └─ /rwa/compliance                  [Check compliance]
├─ /api/v11/analytics/                 [Analytics service]
│  ├─ /analytics/dashboard             [Dashboard data]
│  ├─ /analytics/performance           [Performance metrics]
│  ├─ /analytics/reports               [Generate reports]
│  └─ /analytics/export                [Export data]
├─ /api/v11/security/                  [Security service]
│  ├─ /security/audit                  [Audit logs]
│  ├─ /security/keys                   [Key management]
│  └─ /security/permissions            [RBAC]
└─ /q/                                 [Quarkus endpoints]
   ├─ /q/health                        [Readiness check]
   ├─ /q/health/live                   [Liveness check]
   ├─ /q/health/ready                  [Readiness check]
   └─ /q/metrics                       [Prometheus format]
```

### gRPC Ports (HTTP/2 MANDATORY)
```
Port 9004 - Aurigraph V11 gRPC Server
├─ TransactionService
│  ├─ submitTransaction()
│  ├─ batchSubmitTransactions()
│  ├─ getTransactionStatus()
│  ├─ getTransactionReceipt()
│  ├─ cancelTransaction()
│  ├─ resendTransaction()
│  ├─ estimateGasCost()
│  ├─ validateTransactionSignature()
│  ├─ getPendingTransactions()
│  ├─ getTransactionHistory()
│  ├─ getTxPoolSize()
│  └─ streamTransactionEvents()         [Server streaming]
│
├─ ConsensusService
│  ├─ proposeBlock()
│  ├─ voteOnBlock()
│  ├─ commitBlock()
│  ├─ requestLeaderElection()
│  ├─ heartbeat()
│  ├─ syncState()
│  ├─ getConsensusState()
│  ├─ getValidatorInfo()
│  ├─ submitConsensusMetrics()
│  ├─ getRaftLog()
│  └─ streamConsensusEvents()           [Server streaming]
│
├─ NetworkService
│  ├─ Peer management
│  ├─ Service discovery
│  └─ Network health
│
└─ BlockchainService
   ├─ Block queries
   ├─ Chain state
   └─ History management
```

### Infrastructure Ports
```
Port 8500    - Consul HTTP API & UI
Port 8600    - Consul DNS (UDP)
Port 8200    - HashiCorp Vault HTTP API
Port 9090    - Prometheus Web UI
Port 3000    - Grafana Dashboard & React Portal
Port 16686   - Jaeger UI
Port 14250   - Jaeger gRPC Collector (HTTP/2)
Port 14268   - Jaeger HTTP Collector
Port 9200    - Elasticsearch
Port 9300    - Elasticsearch Node Communication
Port 5601    - Kibana Web UI
Port 5000    - Logstash TCP Input
Port 5044    - Logstash Filebeat Input
Port 9600    - Logstash Monitoring
Port 24224   - Fluentd Log Collection
Port 6379    - Redis Cache
Port 5432    - PostgreSQL Database
Ports 80/443 - NGINX (HTTP → HTTPS redirect, TLS termination)
```

---

# ENTERPRISE PORTAL INTEGRATION

## Portal Architecture & API Integration

### React Frontend Components

**Main App Structure**:
```
enterprise-portal/
├── src/
│   ├── components/
│   │   ├── blockchain/          [Blockchain Management]
│   │   │   ├── BlockchainDashboard.tsx
│   │   │   ├── ERC20TokenManager.tsx
│   │   │   ├── EventFilterExplorer.tsx
│   │   │   ├── BitcoinUTXOManager.tsx
│   │   │   ├── CosmosChainManager.tsx
│   │   │   ├── SolanaManager.tsx
│   │   │   └── SubstrateManager.tsx
│   │   ├── analytics/           [Analytics & Reporting]
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PerformanceMetrics.tsx
│   │   │   ├── TransactionAnalytics.tsx
│   │   │   └── ConsensusMetrics.tsx
│   │   ├── monitoring/          [System Monitoring]
│   │   │   ├── HealthStatus.tsx
│   │   │   ├── NodeMonitor.tsx
│   │   │   ├── PerformanceMonitor.tsx
│   │   │   └── AlertsPanel.tsx
│   │   ├── transactions/        [Transaction Management]
│   │   │   ├── TransactionList.tsx
│   │   │   ├── SubmitTransaction.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   └── BatchSubmission.tsx
│   │   ├── consensus/           [Consensus Management]
│   │   │   ├── ConsensusState.tsx
│   │   │   ├── ValidatorList.tsx
│   │   │   ├── LeaderElection.tsx
│   │   │   └── RaftLog.tsx
│   │   ├── bridge/              [Cross-Chain Bridge]
│   │   │   ├── BridgeTransfer.tsx
│   │   │   ├── SupportedChains.tsx
│   │   │   ├── BridgeHistory.tsx
│   │   │   └── BridgeStatus.tsx
│   │   ├── rwa/                 [Real-World Assets]
│   │   │   ├── RWATokens.tsx
│   │   │   ├── Tokenization.tsx
│   │   │   ├── Compliance.tsx
│   │   │   └── AssetRegistry.tsx
│   │   ├── security/            [Security & RBAC]
│   │   │   ├── AuditLog.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── KeyManagement.tsx
│   │   │   └── PermissionControl.tsx
│   │   └── common/              [Shared Components]
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── services/
│   │   ├── api.ts               [Axios HTTP client]
│   │   ├── blockchain.ts        [Blockchain API]
│   │   ├── transactions.ts      [Transaction Service]
│   │   ├── consensus.ts         [Consensus Service]
│   │   ├── analytics.ts         [Analytics Service]
│   │   ├── bridge.ts            [Bridge Service]
│   │   ├── monitoring.ts        [Monitoring Service]
│   │   └── auth.ts              [OAuth/JWT]
│   │
│   ├── hooks/
│   │   ├── useApi.ts            [API data fetching]
│   │   ├── useAuth.ts           [Authentication]
│   │   ├── useMetrics.ts        [Metrics polling]
│   │   └── useNotifications.ts  [Toast/alerts]
│   │
│   ├── types/
│   │   ├── blockchain.ts
│   │   ├── transaction.ts
│   │   ├── consensus.ts
│   │   ├── analytics.ts
│   │   └── common.ts
│   │
│   └── App.tsx
```

### API Integration Points (ALL must connect to Portal)

#### 1. REST API Integration (Port 9003)

**Service Layer** (`src/services/api.ts`):
```typescript
// Base API client with auto-refresh (5s intervals)
const apiClient = axios.create({
  baseURL: 'https://dlt.aurigraph.io/api/v11',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// JWT token refresh interceptor
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token and retry
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);

// Polling intervals (critical for real-time updates)
const POLL_INTERVALS = {
  health: 5000,          // Health check: 5 seconds
  transactions: 2000,    // Transactions: 2 seconds
  metrics: 5000,         // Performance metrics: 5 seconds
  consensus: 3000,       // Consensus state: 3 seconds
  blocks: 10000,         // Blocks: 10 seconds
  nodes: 30000           // Node list: 30 seconds
};
```

**Blockchain API Endpoints**:
```typescript
// GET /api/v11/blockchain/transactions
const getTransactions = async (options?: {
  limit?: number;
  offset?: number;
  filter?: string;
}) => {
  const response = await apiClient.get('/blockchain/transactions', { params: options });
  return response.data;
};

// GET /api/v11/blockchain/blocks
const getBlocks = async (options?: {
  limit?: number;
  offset?: number;
}) => {
  const response = await apiClient.get('/blockchain/blocks', { params: options });
  return response.data;
};

// GET /api/v11/blockchain/accounts
const getAccounts = async (address?: string) => {
  const response = await apiClient.get('/blockchain/accounts', {
    params: { address }
  });
  return response.data;
};

// GET /api/v11/blockchain/state
const getBlockchainState = async () => {
  const response = await apiClient.get('/blockchain/state');
  return response.data;
};

// GET /api/v11/blockchain/validators
const getValidators = async () => {
  const response = await apiClient.get('/blockchain/validators');
  return response.data;
};
```

**Transaction Service Endpoints**:
```typescript
// POST /api/v11/transactions/submit
const submitTransaction = async (tx: Transaction) => {
  const response = await apiClient.post('/transactions/submit', tx);
  return response.data;
};

// POST /api/v11/transactions/batch
const batchSubmitTransactions = async (transactions: Transaction[]) => {
  const response = await apiClient.post('/transactions/batch', {
    transactions
  });
  return response.data;
};

// GET /api/v11/transactions/{id}
const getTransactionStatus = async (txHash: string) => {
  const response = await apiClient.get(`/transactions/${txHash}`);
  return response.data;
};

// GET /api/v11/transactions/{id}/receipt
const getTransactionReceipt = async (txHash: string) => {
  const response = await apiClient.get(`/transactions/${txHash}/receipt`);
  return response.data;
};

// GET /api/v11/transactions/history
const getTransactionHistory = async (address: string, limit: number = 100) => {
  const response = await apiClient.get('/transactions/history', {
    params: { address, limit }
  });
  return response.data;
};
```

**Consensus Service Endpoints**:
```typescript
// GET /api/v11/consensus/state
const getConsensusState = async () => {
  const response = await apiClient.get('/consensus/state');
  return response.data;
};

// GET /api/v11/consensus/validators
const getConsensusValidators = async () => {
  const response = await apiClient.get('/consensus/validators');
  return response.data;
};

// GET /api/v11/consensus/metrics
const getConsensusMetrics = async () => {
  const response = await apiClient.get('/consensus/metrics');
  return response.data;
};

// GET /api/v11/consensus/leader
const getConsensusLeader = async () => {
  const response = await apiClient.get('/consensus/leader');
  return response.data;
};
```

**Bridge Service Endpoints**:
```typescript
// GET /api/v11/bridge/chains
const getSupportedChains = async () => {
  const response = await apiClient.get('/bridge/chains');
  return response.data;
};

// POST /api/v11/bridge/transfer
const submitBridgeTransfer = async (transfer: BridgeTransfer) => {
  const response = await apiClient.post('/bridge/transfer', transfer);
  return response.data;
};

// GET /api/v11/bridge/status
const getBridgeStatus = async (txHash: string) => {
  const response = await apiClient.get('/bridge/status', {
    params: { tx_hash: txHash }
  });
  return response.data;
};

// GET /api/v11/bridge/history
const getBridgeHistory = async (address?: string) => {
  const response = await apiClient.get('/bridge/history', {
    params: { address }
  });
  return response.data;
};
```

**Analytics Service Endpoints**:
```typescript
// GET /api/v11/analytics/dashboard
const getDashboardData = async () => {
  const response = await apiClient.get('/analytics/dashboard');
  return response.data;
};

// GET /api/v11/analytics/performance
const getPerformanceMetrics = async () => {
  const response = await apiClient.get('/analytics/performance');
  return response.data;
};

// GET /api/v11/analytics/reports
const generateReport = async (type: string, startDate: Date, endDate: Date) => {
  const response = await apiClient.get('/analytics/reports', {
    params: { type, start_date: startDate, end_date: endDate }
  });
  return response.data;
};

// GET /api/v11/analytics/export
const exportData = async (format: 'csv' | 'json' | 'excel') => {
  const response = await apiClient.get('/analytics/export', {
    params: { format }
  });
  return response.data;
};
```

#### 2. gRPC Service Integration (Port 9004, HTTP/2 ONLY)

**Critical: gRPC requires HTTP/2 transport**

**Portal gRPC Integration** (`src/services/grpc.ts`):
```typescript
// gRPC Web client (converts gRPC calls to HTTP/2)
import { TransactionServiceClient } from './generated/transactionServiceClient';
import { ConsensusServiceClient } from './generated/consensusServiceClient';

// Initialize gRPC clients (HTTP/2 enforced)
const grpcConfig = {
  baseURL: 'https://dlt.aurigraph.io/grpc',  // Envoy/gRPC Gateway
  transport: 'http2',  // MANDATORY
  credentials: 'include'  // Include cookies
};

const transactionClient = new TransactionServiceClient('https://dlt.aurigraph.io', grpcConfig);
const consensusClient = new ConsensusServiceClient('https://dlt.aurigraph.io', grpcConfig);

// Transaction Service gRPC Calls
const streamTransactionEvents = (onMessage: Callback, filter?: TransactionFilter) => {
  const stream = transactionClient.streamTransactionEvents(filter);

  stream.on('data', message => {
    onMessage(message);
  });

  stream.on('error', error => {
    console.error('Stream error:', error);
  });

  stream.on('end', () => {
    console.log('Stream ended');
  });

  return stream;
};

// Consensus Service gRPC Calls (Server streaming)
const streamConsensusEvents = (onMessage: Callback, filters?: ConsensusEventFilter) => {
  const stream = consensusClient.streamConsensusEvents(filters);

  stream.on('data', message => {
    onMessage(message);
  });

  stream.on('error', error => {
    console.error('Consensus stream error:', error);
  });

  return stream;
};

// Bidirectional streaming for real-time consensus
const consensusHeartbeat = (validator: Validator, interval: number = 5000) => {
  const bidiStream = consensusClient.heartbeat();

  const heartbeatInterval = setInterval(() => {
    bidiStream.write({
      leaderId: validator.id,
      currentTerm: validator.term,
      lastLogIndex: validator.lastIndex
    });
  }, interval);

  bidiStream.on('data', response => {
    // Handle response
  });

  return {
    stream: bidiStream,
    stop: () => clearInterval(heartbeatInterval)
  };
};
```

#### 3. Health Check & Monitoring Integration

**Health Endpoints** (all on Port 9003):
```typescript
// GET /api/v11/health (Quarkus readiness)
const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
};

// GET /q/health/live (Liveness probe)
const checkLiveness = async () => {
  try {
    const response = await apiClient.get('/q/health/live');
    return response.status === 200;
  } catch {
    return false;
  }
};

// GET /q/health/ready (Readiness probe)
const checkReadiness = async () => {
  try {
    const response = await apiClient.get('/q/health/ready');
    return response.data.status === 'UP';
  } catch {
    return false;
  }
};

// Auto-polling health (every 5 seconds)
useEffect(() => {
  const healthInterval = setInterval(async () => {
    const health = await checkHealth();
    setSystemHealth(health);
  }, 5000);

  return () => clearInterval(healthInterval);
}, []);
```

#### 4. Metrics Integration (Prometheus)

**Metrics Collection** (Port 9090):
```typescript
// Portal can query Prometheus for historical metrics
const queryPrometheus = async (query: string, range?: DateRange) => {
  const response = await axios.get('http://prometheus:9090/api/v1/query_range', {
    params: {
      query,
      start: range?.start,
      end: range?.end,
      step: '15s'
    }
  });
  return response.data.data.result;
};

// Example: Query TPS over time
const getThroughputMetrics = async () => {
  return queryPrometheus(
    'rate(aurigraph_transactions_total[1m])',
    { start: Date.now() - 3600000, end: Date.now() }
  );
};

// Example: Query consensus latency
const getConsensusLatency = async () => {
  return queryPrometheus(
    'histogram_quantile(0.95, aurigraph_consensus_latency_ms)',
    { start: Date.now() - 3600000, end: Date.now() }
  );
};
```

### Portal Dashboard Components

**Main Dashboard** (`src/components/Dashboard.tsx`):
```typescript
export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthStatus>({});
  const [txStream, setTxStream] = useState<TransactionEvent[]>([]);
  const [consensusStream, setConsensusStream] = useState<ConsensusEvent[]>([]);

  // Fetch dashboard data on load
  useEffect(() => {
    const loadDashboard = async () => {
      const data = await api.blockchain.getDashboardData();
      setStats(data);
    };
    loadDashboard();
  }, []);

  // Real-time transaction stream (gRPC)
  useEffect(() => {
    const unsubscribe = grpc.streamTransactionEvents(
      (event: TransactionEvent) => {
        setTxStream(prev => [event, ...prev].slice(0, 100)); // Keep last 100
      }
    );

    return unsubscribe;
  }, []);

  // Real-time consensus events (gRPC)
  useEffect(() => {
    const unsubscribe = grpc.streamConsensusEvents(
      (event: ConsensusEvent) => {
        setConsensusStream(prev => [event, ...prev].slice(0, 50));
      }
    );

    return unsubscribe;
  }, []);

  return (
    <div className="dashboard">
      <header>
        <h1>Aurigraph DLT Dashboard</h1>
        <HealthIndicator status={health} />
      </header>

      <section className="metrics">
        <MetricCard title="TPS" value={stats?.tps} trend="up" />
        <MetricCard title="Block Height" value={stats?.blockHeight} />
        <MetricCard title="Active Validators" value={stats?.validatorCount} />
        <MetricCard title="Network Health" value={stats?.networkHealth} />
      </section>

      <section className="streams">
        <TransactionStream events={txStream} />
        <ConsensusStream events={consensusStream} />
      </section>

      <section className="management">
        <BlockchainManagement />
        <TransactionManagement />
        <ConsensusManagement />
        <BridgeManagement />
      </section>
    </div>
  );
};
```

---

# gRPC & PROTOCOL BUFFERS

## HTTP/2 Requirement (CRITICAL)

### Why HTTP/2 is Mandatory for gRPC

**gRPC Protocol Specification**:
- gRPC is built on HTTP/2
- Cannot use HTTP/1.1 (connection reset if attempted)
- Requires multiplexed streams
- Requires binary framing
- Requires push promise capability
- HPACK header compression (required)

**Port 9004 Configuration** (HTTP/2 ONLY):
```yaml
quarkus:
  grpc:
    server:
      port: 9004
      enable-keep-alive: true
      keep-alive-time: 30s
      max-inbound-message-size: 4194304  # 4MB
      use-http2: true  # MANDATORY

  http:
    http2:
      enabled: true
      max-concurrent-streams: 100
```

### NGINX Configuration for gRPC (HTTP/2)

```nginx
# CRITICAL: HTTP/2 must be enabled
http2_max_field_size 32k;
http2_max_header_size 64k;

upstream grpc_backend {
    server localhost:9004 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;

    # gRPC routing (MUST use HTTP/2)
    location /grpc/ {
        proxy_pass http://grpc_backend;
        proxy_http_version 2.0;         # CRITICAL: HTTP/2
        proxy_buffering off;            # Required for streaming
        proxy_request_buffering off;    # Required for streaming

        # gRPC-specific headers
        proxy_set_header Connection "";
        proxy_set_header Content-Type application/grpc;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;        # Long timeout for streams
    }

    # Alternative: Envoy proxy (recommended for production)
    location /envoy/ {
        proxy_pass http://envoy:10000;
        proxy_http_version 2.0;
        proxy_buffering off;
    }
}
```

### Portal gRPC Integration (HTTP/2)

**gRPC Web Client** (uses HTTP/2 under the hood):
```typescript
import { grpc } from '@grpc/grpc-js';
import { TransactionServiceClient } from './generated/TransactionServiceClientPb';

// HTTP/2 channel configuration
const channelConfig = {
  'grpc.max_receive_message_length': -1,  // Unlimited
  'grpc.max_send_message_length': -1,     // Unlimited
  'grpc.keepalive_time_ms': 30000,
  'grpc.keepalive_timeout_ms': 10000,
  'grpc.http2.min_time_between_pings_ms': 10000
};

// Create gRPC client (requires HTTP/2)
const client = new TransactionServiceClient(
  'https://dlt.aurigraph.io:443',  // TLS endpoint
  grpc.credentials.createSsl(),
  channelConfig
);

// Server streaming example (HTTP/2 multiplexing)
const stream = client.streamTransactionEvents(
  new StreamTransactionEventsRequest()
);

let receivedCount = 0;
stream.on('data', (response: TransactionEvent) => {
  console.log('Received transaction event:', response);
  receivedCount++;
  updateUI(response);
});

stream.on('error', (error: any) => {
  console.error('Stream error:', error);
});

stream.on('end', () => {
  console.log(`Stream ended after ${receivedCount} events`);
});
```

### Protocol Buffer Services (All on Port 9004 + HTTP/2)

**1. TransactionService** (12 RPC methods):
```protobuf
service TransactionService {
  // Unary RPC
  rpc submitTransaction(SubmitTransactionRequest)
    returns (TransactionSubmissionResponse);

  rpc batchSubmitTransactions(BatchTransactionSubmissionRequest)
    returns (BatchTransactionSubmissionResponse);

  rpc getTransactionStatus(GetTransactionStatusRequest)
    returns (TransactionStatusResponse);

  // Server streaming (real-time events)
  rpc streamTransactionEvents(StreamTransactionEventsRequest)
    returns (stream TransactionEvent);

  // ... 8 more methods
}
```

**2. ConsensusService** (11 RPC methods, HyperRAFT++):
```protobuf
service ConsensusService {
  // Block proposal & voting
  rpc proposeBlock(ProposeBlockRequest)
    returns (ProposeBlockResponse);

  rpc voteOnBlock(VoteOnBlockRequest)
    returns (VoteOnBlockResponse);

  // Consensus state
  rpc getConsensusState(GetConsensusStateRequest)
    returns (ConsensusStateResponse);

  // Server streaming (consensus events)
  rpc streamConsensusEvents(StreamConsensusEventsRequest)
    returns (stream ConsensusEvent);

  // ... 7 more methods
}
```

**3. NetworkService**:
```protobuf
service NetworkService {
  rpc getPeerList(GetPeerListRequest)
    returns (PeerListResponse);

  rpc getNetworkHealth(GetNetworkHealthRequest)
    returns (NetworkHealthResponse);

  rpc streamNetworkEvents(StreamNetworkEventsRequest)
    returns (stream NetworkEvent);
}
```

**4. BlockchainService**:
```protobuf
service BlockchainService {
  rpc getBlock(GetBlockRequest)
    returns (BlockResponse);

  rpc getBlockRange(GetBlockRangeRequest)
    returns (BlockRangeResponse);

  rpc getAccountState(GetAccountStateRequest)
    returns (AccountStateResponse);
}
```

---

# DEPLOYMENT WORKFLOW

## Phased Deployment Strategy (10 Stages)

### STAGE 1: Infrastructure Foundation
**Duration**: 30-60 minutes
**J4C Agent**: Platform Architect

**Tasks**:
- [ ] Create volumes: postgres-data, leveldb-data, elasticsearch-data
- [ ] Create networks: aurigraph-production (primary), monitoring, logging
- [ ] Create secrets in Vault: bridge keys, database passwords, API keys
- [ ] Configure NGINX (HTTP/2 + SSL/TLS 1.3)
- [ ] Set up Consul service registry
- [ ] Provision 100GB+ storage for Elasticsearch logs

**Deployment Command**:
```bash
# Create infrastructure
docker volume create postgres-data
docker volume create leveldb-data
docker volume create elasticsearch-data

# Create networks
docker network create aurigraph-production
docker network create monitoring
docker network create logging

# Start infrastructure services
docker-compose -f docker-compose-infrastructure.yml up -d
```

### STAGE 2: Data Layer Initialization
**Duration**: 10-20 minutes
**J4C Agent**: Database Administrator

**Tasks**:
- [ ] Start PostgreSQL container
- [ ] Run Flyway migrations
- [ ] Initialize Hibernateentity scanning
- [ ] Create default tables & indexes
- [ ] Start Redis cache
- [ ] Verify database connectivity

**Deployment Command**:
```bash
docker-compose up -d postgres redis

# Wait for postgres to be ready
sleep 30

# Run migrations
docker exec aurigraph-v11 ./mvnw flyway:migrate

# Verify
docker exec postgres psql -U aurigraph -d aurigraph_v11 -c "SELECT COUNT(*) FROM information_schema.tables;"
```

### STAGE 3: Core Blockchain Services
**Duration**: 5-10 minutes
**J4C Agent**: Consensus Protocol Agent

**Tasks**:
- [ ] Start V11 REST API (port 9003, HTTP/2)
- [ ] Start V11 gRPC Server (port 9004, HTTP/2 MANDATORY)
- [ ] Verify both ports accepting connections
- [ ] Confirm health checks passing
- [ ] Register services with Consul

**Deployment Command**:
```bash
# Start V11 services
docker-compose up -d aurigraph-v11

# Verify REST API (HTTP/2)
curl --http2 https://dlt.aurigraph.io/api/v11/health

# Verify gRPC (HTTP/2 only - will error on HTTP/1.1)
grpcurl -plaintext localhost:9004 list

# Check Consul registration
curl http://localhost:8500/v1/catalog/services
```

### STAGE 4: Load Balancing & Reverse Proxy
**Duration**: 5 minutes
**J4C Agent**: Network Infrastructure Agent

**Tasks**:
- [ ] Configure NGINX upstream for REST (port 9003)
- [ ] Configure NGINX upstream for gRPC (port 9004, HTTP/2)
- [ ] Enable SSL/TLS 1.3
- [ ] Test routing to both services
- [ ] Set up health checks
- [ ] Configure failover to JVM if native fails

**NGINX Configuration** (CRITICAL):
```nginx
# HTTP/2 mandatory
server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    # REST API (HTTP/2 compatible)
    location /api/v11/ {
        proxy_pass http://v11_rest:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # gRPC (HTTP/2 MANDATORY)
    location /grpc/ {
        proxy_pass http://v11_grpc:9004;
        proxy_http_version 2.0;         # CRITICAL: HTTP/2
        proxy_buffering off;            # Required for streaming
        proxy_set_header Content-Type application/grpc;
    }
}
```

**Deployment Command**:
```bash
docker-compose up -d nginx

# Test REST API via proxy
curl https://dlt.aurigraph.io/api/v11/health

# Test gRPC via proxy (must use HTTP/2)
grpcurl -plaintext dlt.aurigraph.io:443 list
```

### STAGE 5: Monitoring Stack
**Duration**: 10-15 minutes
**J4C Agent**: Monitoring Agent

**Tasks**:
- [ ] Start Prometheus (port 9090)
- [ ] Start Grafana (port 3000)
- [ ] Start Jaeger (port 16686, 14250 gRPC)
- [ ] Configure Prometheus scrape targets
- [ ] Import Grafana dashboards
- [ ] Set up alert rules

**Deployment Command**:
```bash
# Start monitoring stack
docker-compose -f docker-compose-monitoring.yml up -d

# Verify Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify Grafana
curl http://localhost:3000/api/health

# Verify Jaeger
curl http://localhost:16686/
```

### STAGE 6: Logging Stack (ELK)
**Duration**: 15-20 minutes
**J4C Agent**: Monitoring Agent

**Tasks**:
- [ ] Start Elasticsearch (port 9200, persistence enabled)
- [ ] Start Kibana (port 5601)
- [ ] Start Logstash (port 5000/5044)
- [ ] Start Fluentd (port 24224)
- [ ] Create index patterns in Kibana
- [ ] Verify log collection

**Deployment Command**:
```bash
# Start ELK stack
docker-compose -f docker-compose-elk.yml up -d

# Wait for Elasticsearch to be ready
sleep 60

# Create index pattern
curl -X POST "http://localhost:9200/_index_template/aurigraph" \
  -H 'Content-Type: application/json' \
  -d'{
    "index_patterns": ["aurigraph-*"],
    "template": {
      "settings": {"number_of_shards": 3}
    }
  }'

# Verify Kibana
curl http://localhost:5601/api/status
```

### STAGE 7: Enterprise Portal Deployment
**Duration**: 5-10 minutes
**J4C Agent**: Frontend Developer

**Tasks**:
- [ ] Build React frontend (npm run build)
- [ ] Copy dist folder to portal container
- [ ] Start portal on port 3000
- [ ] Configure API base URL (https://dlt.aurigraph.io/api/v11)
- [ ] Configure gRPC endpoint (https://dlt.aurigraph.io/grpc)
- [ ] Test all integrations
- [ ] Verify health polling (5s intervals)

**Deployment Command**:
```bash
# Build portal
cd enterprise-portal/enterprise-portal/frontend
npm run build

# Deploy portal
docker-compose up -d dlt-portal

# Verify portal
curl http://localhost:3000

# Test API integration
curl http://localhost:3000/api/health

# Test gRPC integration (via grpcurl)
grpcurl -plaintext localhost:9004 list
```

### STAGE 8: Multi-Node Cluster Expansion
**Duration**: 30-45 minutes
**J4C Agent**: Consensus Protocol Agent

**Tasks**:
- [ ] Deploy validator node (primary consensus)
- [ ] Deploy business nodes (2-6 transaction processing)
- [ ] Deploy slim nodes (optional RPC)
- [ ] Initialize RAFT consensus
- [ ] Verify leader election
- [ ] Monitor consensus metrics
- [ ] Run health checks across cluster

**Deployment Command**:
```bash
# Deploy multi-node cluster
docker-compose -f docker-compose-native-cluster.yml up -d

# Verify consensus state
curl http://localhost:9003/api/v11/consensus/state

# Monitor cluster health
watch 'curl http://localhost:9090/api/v1/query?query=up'

# Check RAFT logs
grpcurl -plaintext localhost:9004 \
  io.aurigraph.v11.proto.ConsensusService/getRaftLog
```

### STAGE 9: Load Testing & Validation
**Duration**: 60+ minutes
**J4C Agent**: Testing Agent

**Tasks**:
- [ ] Run load tests targeting 2M+ TPS
- [ ] Validate REST API (port 9003) throughput
- [ ] Validate gRPC (port 9004, HTTP/2) throughput
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Verify no packet loss in gRPC streams
- [ ] Test failover scenarios
- [ ] Validate monitoring data collection

**Load Test Commands**:
```bash
# Load test REST API
wrk -t12 -c400 -d30s -s scripts/transactions.lua \
  https://dlt.aurigraph.io/api/v11/transactions/submit

# Load test gRPC (HTTP/2)
ghz --insecure \
  --proto ./protos/transaction.proto \
  --call io.aurigraph.v11.proto.TransactionService/submitTransaction \
  -d '{"transaction":"..."}' \
  -c 100 -n 10000 \
  localhost:9004

# Monitor metrics during load test
curl 'http://prometheus:9090/api/v1/query_range?query=rate(aurigraph_transactions_total[1m])&start=...'
```

### STAGE 10: Production Hardening
**Duration**: 30-60 minutes
**J4C Agent**: DevOps Agent

**Tasks**:
- [ ] Enable TLS 1.3 everywhere (Vault, NGINX, gRPC)
- [ ] Configure Vault authentication
- [ ] Enable audit logging
- [ ] Set up backup/restore procedures
- [ ] Configure RBAC & permissions
- [ ] Enable rate limiting (1000 req/min per user)
- [ ] Set up disaster recovery procedures
- [ ] Create runbooks for common issues

**Security Commands**:
```bash
# Enable TLS 1.3
openssl s_client -connect dlt.aurigraph.io:443 -tls1_3

# Verify TLS version
curl -v https://dlt.aurigraph.io/api/v11/health 2>&1 | grep "TLS"

# Configure Vault authentication
vault auth enable approle
vault write auth/approle/role/aurigraph \
  token_num_uses=0 \
  policies="aurigraph"

# Enable audit logging
vault audit enable file file_path=/var/log/vault/audit.log
```

---

# CONFIGURATION MANAGEMENT

## Complete Configuration Hierarchy

### 1. Environment Variables (Overrides All)

```bash
# Blockchain Configuration
export TARGET_TPS=2000000
export PARALLEL_THREADS=256
export QUANTUM_LEVEL=5
export CONSENSUS_ALGORITHM=HyperRAFT++
export AI_OPTIMIZATION_ENABLED=true

# Port Configuration (gRPC HTTP/2 CRITICAL)
export QUARKUS_HTTP_PORT=9003
export QUARKUS_GRPC_SERVER_PORT=9004
export QUARKUS_HTTP_HTTP2_ENABLED=true
export QUARKUS_GRPC_SERVER_USE_HTTP2=true

# Database
export DB_URL=jdbc:postgresql://postgres:5432/aurigraph_v11
export DB_USER=aurigraph
export DB_PASSWORD=<secret>

# Vault Secrets
export VAULT_ADDR=http://vault:8200
export VAULT_TOKEN=<root-token>
export BRIDGE_ETH_KEY=<secret>
export BRIDGE_SOL_KEY=<secret>

# SSL/TLS
export SSL_ENABLED=true
export SSL_PROTOCOL=TLSv1.3
export SSL_CERT_PATH=/etc/ssl/certs/server.pem
export SSL_KEY_PATH=/etc/ssl/private/server.key

# Monitoring
export PROMETHEUS_ENABLED=true
export JAEGER_ENABLED=true
export JAEGER_SAMPLER_TYPE=const
export JAEGER_SAMPLER_PARAM=1.0

# Logging
export LOGGING_LEVEL=INFO
export LOG_FORMAT=json
export ELASTICSEARCH_ENABLED=true
export ELASTICSEARCH_URL=http://elasticsearch:9200
```

### 2. Application Properties (Base Configuration)

**File**: `src/main/resources/application.properties` (1,208 lines)

**Key Sections**:
```properties
# Quarkus core
quarkus.application.name=aurigraph-v11-standalone
quarkus.application.version=11.4.4
quarkus.profile=prod

# HTTP/2 and gRPC (CRITICAL)
quarkus.http.port=9003
quarkus.http.http2=true
quarkus.http.http2.max-concurrent-streams=100

quarkus.grpc.server.port=9004
quarkus.grpc.server.enable-keep-alive=true
quarkus.grpc.server.keep-alive-time=30s
quarkus.grpc.server.use-http2=true

# Database
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://postgres:5432/aurigraph_v11
quarkus.datasource.username=aurigraph
quarkus.datasource.password=${DB_PASSWORD}
quarkus.datasource.jdbc.max-size=20
quarkus.datasource.jdbc.min-size=5

# Flyway migrations
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true

# Hibernate ORM
quarkus.hibernate-orm.database.generation=update
quarkus.hibernate-orm.packages=io.aurigraph.v11.models

# Redis cache
quarkus.redis.hosts=redis://redis:6379

# Prometheus metrics
quarkus.micrometer.enabled=true
quarkus.micrometer.binder.http-server.enabled=true
quarkus.micrometer.binder.jvm.enabled=true

# Jaeger tracing
quarkus.jaeger.sampler.type=const
quarkus.jaeger.sampler.param=1.0
quarkus.jaeger.endpoint=http://jaeger:14268/api/traces

# Logging (JSON format for ELK)
quarkus.log.console.format=%d{yyyy-MM-dd HH:mm:ss,SSS} %-5p [%c{3}] %m%n
quarkus.log.console.json=true
quarkus.log.handler.json-fields=timestamp,level,logger,message,mdc

# Security/RBAC
quarkus.oidc.provider=https://iam2.aurigraph.io/auth/realms/AWD
quarkus.oidc.client-id=aurigraph-v11
quarkus.oidc.credentials.secret=${OIDC_SECRET}
```

### 3. Profile-Specific Overrides

**Development** (`application-dev.properties`):
```properties
quarkus.log.level=DEBUG
quarkus.hibernate-orm.log.sql=true
quarkus.datasource.jdbc.max-size=5
quarkus.grpc.server.max-inbound-message-size=104857600
```

**Production** (`application-prod.properties`):
```properties
quarkus.log.level=INFO
quarkus.hibernate-orm.log.sql=false
quarkus.datasource.jdbc.max-size=50
quarkus.grpc.server.max-inbound-message-size=4194304
quarkus.tls.enabled=true
```

### 4. Docker Compose Profiles

**Profiles Available**:
- `native` - GraalVM native binary (256MB, <1s startup)
- `jvm` - Standard JVM (512MB, ~8s startup)
- `cluster` - Multi-node deployment (3+ nodes)
- `monitoring` - Full monitoring stack (Prometheus, Grafana, Jaeger)
- `elk` - ELK stack for logging (Elasticsearch, Logstash, Kibana)
- `vault` - Vault + Consul for secrets
- `production` - All of the above (23+ services)

---

# SECURITY INFRASTRUCTURE

[Continue with remaining sections...]

Due to length, let me create this as a comprehensive file. Let me save the COMPREHENSIVE section:
