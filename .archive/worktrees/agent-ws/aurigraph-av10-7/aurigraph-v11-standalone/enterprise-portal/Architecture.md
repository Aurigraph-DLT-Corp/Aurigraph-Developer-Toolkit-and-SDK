# Architecture Document
# Aurigraph Enterprise Portal V4.4.1

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**System Version**: 4.4.1
**Status**: Production

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Integration Architecture](#integration-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Security Architecture](#security-architecture)
9. [Performance Architecture](#performance-architecture)
10. [Testing Architecture](#testing-architecture)
11. [Monitoring & Observability](#monitoring--observability)
12. [Disaster Recovery](#disaster-recovery)

---

## System Overview

### Purpose
The Aurigraph Enterprise Portal is a React-based single-page application (SPA) that provides comprehensive management, monitoring, and demonstration capabilities for the Aurigraph V11 blockchain platform.

### Architecture Style
- **Frontend**: Single-Page Application (SPA) with React
- **Backend**: RESTful APIs with HTTP/2
- **State Management**: Redux Toolkit with normalized state
- **Communication**: REST + WebSocket (planned), currently polling
- **Deployment**: Static files served via NGINX reverse proxy

### Technology Stack

#### Frontend Stack
```
React 18.2.0                    # UI framework
TypeScript 5.3.3                # Type safety
Material-UI 5.14.20             # Component library
Redux Toolkit 2.0.1             # State management
React Router 6.20.1             # Client-side routing
Recharts 2.10.3                 # Data visualization
MUI X-Charts 6.18.3             # Advanced charts
MUI X-Data-Grid 6.18.3          # Data tables
Axios 1.6.2                     # HTTP client
Vite 5.0.8                      # Build tool
Vitest 1.6.1                    # Testing framework
```

#### Backend Integration
```
Aurigraph V11 Platform 11.3.3   # Blockchain backend
Java 21 + Quarkus 3.28.2        # Backend framework
gRPC + HTTP/2                   # Transport protocols
PostgreSQL (planned)            # Persistent storage
Redis (planned)                 # Caching layer
```

#### Infrastructure
```
NGINX 1.18+                     # Reverse proxy
Let's Encrypt                   # SSL certificates
Ubuntu 24.04.3 LTS              # Operating system
Docker 28.4.0                   # Containerization
```

---

## Architecture Principles

### 1. Separation of Concerns
- Clear separation between UI components, business logic, and data access
- Feature-based folder structure
- Reusable, single-responsibility components

### 2. Scalability
- Component-based architecture for horizontal scaling
- Lazy loading for code splitting
- Virtual scrolling for large datasets
- Efficient state management

### 3. Maintainability
- TypeScript for type safety
- Comprehensive testing (85%+ coverage)
- Documented components with JSDoc
- Consistent coding standards

### 4. Performance
- Optimized bundle size (<1MB gzipped)
- Code splitting and lazy loading
- Memoization for expensive computations
- Efficient rendering with React.memo

### 5. Security
- HTTPS-only communication
- Input sanitization and validation
- CORS configuration
- Content Security Policy (CSP)
- OAuth 2.0 authentication (planned)

### 6. Reliability
- Error boundaries for fault tolerance
- Graceful degradation
- Retry logic for failed requests
- Fallback UI for errors

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           Enterprise Portal (React SPA)                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  Dashboard  │  │ Transactions │  │  Node Mgmt      │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  Channels   │  │  Contracts   │  │  RWAT Registry  │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  Security   │  │  Developer   │  │  Demo System    │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              │ HTTPS/TLS 1.3                      │
│                              ▼                                    │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                       NGINX REVERSE PROXY                        │
│                    (dlt.aurigraph.io:443)                        │
│  - SSL Termination (Let's Encrypt)                              │
│  - Request routing                                               │
│  - Static file serving                                           │
│  - Compression (gzip/brotli)                                     │
│  - Security headers                                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTP
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Aurigraph V11 Backend (Port 9003)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    REST API Layer                         │  │
│  │  /api/v11/blockchain/*   /api/v11/nodes/*                │  │
│  │  /api/v11/channels/*     /api/v11/contracts/*            │  │
│  │  /api/v11/demos/*        /api/v11/health                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Business Logic Layer                    │  │
│  │  - Transaction Service    - Consensus Service            │  │
│  │  - Node Management        - Channel Service              │  │
│  │  - Contract Service       - RWAT Registry                │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Blockchain Layer                       │  │
│  │  - HyperRAFT++ Consensus  - Merkle Tree Registry         │  │
│  │  - Transaction Pool       - State Management             │  │
│  │  - Block Production       - Network P2P                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Directory Structure

```
enterprise-portal/
├── public/                          # Static assets
│   └── index.html                   # HTML template
│
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component
│   ├── DemoApp.tsx                  # Demo orchestration component
│   │
│   ├── components/                  # Reusable components
│   │   ├── DemoRegistration.tsx     # Demo registration wizard
│   │   ├── DemoListView.tsx         # Demo management UI
│   │   ├── NodeVisualization.tsx    # Node graph component (in progress)
│   │   ├── RicardianContractUpload.tsx # Contract upload
│   │   └── ...                      # Other components
│   │
│   ├── pages/                       # Page components
│   │   ├── Dashboard.tsx            # Main dashboard
│   │   ├── Transactions.tsx         # Transaction management
│   │   ├── NodeManagement.tsx       # Node configuration
│   │   ├── Analytics.tsx            # Analytics dashboard
│   │   └── dashboards/              # Specialized dashboards
│   │       ├── DeveloperDashboard.tsx
│   │       ├── RicardianContracts.tsx
│   │       └── SecurityAudit.tsx
│   │
│   ├── services/                    # API and business logic
│   │   ├── api.ts                   # API client configuration
│   │   ├── BlockchainService.ts     # Blockchain API calls
│   │   ├── NodeService.ts           # Node management API
│   │   ├── ChannelService.ts        # Channel management API
│   │   ├── ContractService.ts       # Contract API
│   │   └── DemoService.ts           # Demo system API (planned)
│   │
│   ├── store/                       # Redux state management
│   │   ├── index.ts                 # Store configuration
│   │   ├── slices/                  # Feature slices
│   │   │   ├── blockchainSlice.ts   # Blockchain state
│   │   │   ├── nodeSlice.ts         # Node state
│   │   │   ├── channelSlice.ts      # Channel state
│   │   │   └── demoSlice.ts         # Demo state (planned)
│   │   └── hooks.ts                 # Typed Redux hooks
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── blockchain.ts            # Blockchain types
│   │   ├── node.ts                  # Node types
│   │   ├── channel.ts               # Channel types
│   │   ├── demo.ts                  # Demo types
│   │   └── api.ts                   # API response types
│   │
│   ├── utils/                       # Utility functions
│   │   ├── formatters.ts            # Data formatting
│   │   ├── validators.ts            # Input validation
│   │   ├── constants.ts             # Application constants
│   │   └── helpers.ts               # Helper functions
│   │
│   └── styles/                      # Global styles
│       ├── theme.ts                 # MUI theme configuration
│       └── global.css               # Global CSS
│
├── tests/                           # Test files
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # End-to-end tests
│
├── docs/                            # Documentation
│   ├── PRD.md                       # Product requirements
│   ├── Architecture.md              # This file
│   ├── OAUTH_SETUP.md               # OAuth integration guide
│   ├── MONITORING_SETUP.md          # Monitoring setup
│   └── BACKUP_AUTOMATION.md         # Backup procedures
│
└── config/                          # Configuration files
    ├── vite.config.ts               # Vite build configuration
    ├── tsconfig.json                # TypeScript configuration
    └── vitest.config.ts             # Testing configuration
```

### Component Hierarchy

```
App (Root)
│
├── Router (React Router)
│   │
│   ├── Dashboard Page
│   │   ├── MetricsCards
│   │   ├── TPSChart
│   │   ├── TransactionChart
│   │   └── NodeStatusGrid
│   │
│   ├── Transactions Page
│   │   ├── TransactionFilters
│   │   ├── TransactionTable (DataGrid)
│   │   └── TransactionDetailsDialog
│   │
│   ├── Node Management Page
│   │   ├── NodeList
│   │   ├── NodeConfigForm
│   │   └── NodeMetricsPanel
│   │
│   ├── Channel Management Page
│   │   ├── ChannelList
│   │   ├── ChannelCreateWizard
│   │   └── ChannelWebSocketStatus
│   │
│   ├── Ricardian Contracts Page
│   │   ├── ContractUploadForm
│   │   ├── ContractList
│   │   └── ContractDetailsDialog
│   │
│   ├── RWAT Registry Page
│   │   ├── AssetRegistrationForm
│   │   ├── AssetList
│   │   └── MerkleProofViewer
│   │
│   ├── Security Audit Page
│   │   ├── SecurityChecksList
│   │   ├── AuditTrail
│   │   └── ComplianceReport
│   │
│   ├── Developer Dashboard Page
│   │   ├── APIMetrics
│   │   ├── APIDocumentation
│   │   └── SDKDownloads
│   │
│   └── Demo System (DemoApp)
│       ├── DemoRegistration (Dialog)
│       │   ├── UserInfoStep
│       │   ├── ChannelConfigStep
│       │   ├── NodeConfigStep
│       │   └── ReviewStep
│       │
│       ├── DemoListView
│       │   ├── DemoSummaryCards
│       │   ├── DemoTable
│       │   └── DemoDetailsDialog
│       │       ├── OverviewTab
│       │       ├── ChannelsTab
│       │       ├── NodesTab
│       │       └── MerkleTreeTab
│       │
│       └── NodeVisualization
│           ├── NodeGraph
│           ├── NodeTooltip
│           └── NodeLegend
│
└── Redux Store
    ├── Blockchain State
    ├── Node State
    ├── Channel State
    ├── Demo State
    └── UI State
```

---

## Data Flow

### State Management Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Redux Store (Single Source of Truth)       │
├────────────────────────────────────────────────────────────────┤
│  blockchainSlice:                                              │
│    - stats: { tps, nodes, transactions, health }              │
│    - transactions: Transaction[]                              │
│    - blocks: Block[]                                           │
│                                                                 │
│  nodeSlice:                                                    │
│    - nodes: Node[]                                             │
│    - selectedNode: Node | null                                 │
│    - metrics: NodeMetrics                                      │
│                                                                 │
│  channelSlice:                                                 │
│    - channels: Channel[]                                       │
│    - activeChannels: string[]                                  │
│    - wsConnections: Map<channelId, WebSocket>                 │
│                                                                 │
│  demoSlice: (planned)                                          │
│    - demos: DemoInstance[]                                     │
│    - activeDemos: string[]                                     │
│    - merkleRoots: Map<demoId, string>                         │
│                                                                 │
│  uiSlice:                                                      │
│    - loading: boolean                                          │
│    - errors: Error[]                                           │
│    - notifications: Notification[]                             │
└────────────────────────────────────────────────────────────────┘
                          │             ▲
                          │             │
                    dispatch       state updates
                          │             │
                          ▼             │
┌────────────────────────────────────────────────────────────────┐
│                       React Components                          │
│  - useSelector() to read state                                 │
│  - useDispatch() to dispatch actions                           │
│  - React hooks for local component state                       │
└────────────────────────────────────────────────────────────────┘
                          │             ▲
                          │             │
                    API calls      responses
                          │             │
                          ▼             │
┌────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
│  BlockchainService.getStats()                                  │
│  NodeService.getNodes()                                        │
│  ChannelService.createChannel()                                │
│  DemoService.registerDemo()                                    │
└────────────────────────────────────────────────────────────────┘
                          │             ▲
                          │             │
                    HTTPS         JSON responses
                          │             │
                          ▼             │
┌────────────────────────────────────────────────────────────────┐
│                   Backend REST API (V11)                        │
│  GET /api/v11/blockchain/stats                                 │
│  GET /api/v11/nodes                                            │
│  POST /api/v11/channels                                        │
│  POST /api/v11/demos                                           │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### 1. Read Operations (GET)
```
Component renders
  ↓
useEffect() triggered
  ↓
dispatch(fetchBlockchainStats())
  ↓
Redux Thunk middleware
  ↓
BlockchainService.getStats()
  ↓
axios.get('/api/v11/blockchain/stats')
  ↓
Backend processes request
  ↓
JSON response returned
  ↓
Redux action dispatched with payload
  ↓
Reducer updates state
  ↓
Component re-renders with new state
```

#### 2. Write Operations (POST/PUT)
```
User interaction (button click)
  ↓
Event handler triggered
  ↓
dispatch(createDemo(formData))
  ↓
Redux Thunk middleware
  ↓
DemoService.createDemo(data)
  ↓
axios.post('/api/v11/demos', data)
  ↓
Backend validates and processes
  ↓
Success/error response
  ↓
Redux action dispatched
  ↓
Reducer updates state
  ↓
UI shows success notification
  ↓
Component refetches updated data
```

#### 3. Real-time Updates (Polling)
```
Component mounts
  ↓
setInterval(() => fetchData(), 5000)
  ↓
Periodic API calls
  ↓
State updates
  ↓
Component re-renders
  ↓
Component unmounts
  ↓
clearInterval()
```

#### 4. WebSocket Updates (Planned)
```
Component mounts
  ↓
WebSocket connection established
  ↓
Subscribe to channel events
  ↓
Backend sends updates
  ↓
WebSocket message received
  ↓
dispatch(updateFromWebSocket(data))
  ↓
State updated
  ↓
Component re-renders
```

---

## Integration Architecture

### Backend API Integration

#### API Client Configuration
```typescript
// src/services/api.ts
const API_BASE = 'https://dlt.aurigraph.io/api/v11';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token when available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

#### API Endpoints Matrix

| Feature | Endpoint | Method | Status | Used By |
|---------|----------|--------|--------|---------|
| **Blockchain** |
| Network stats | `/blockchain/stats` | GET | ✅ Active | Dashboard, Analytics |
| Transactions | `/blockchain/transactions` | GET | ✅ Active | Transactions page |
| Transaction details | `/blockchain/transactions/:hash` | GET | ✅ Active | Transaction details |
| Blocks | `/blockchain/blocks` | GET | ✅ Active | Blockchain Operations |
| **Nodes** |
| List nodes | `/nodes` | GET | ✅ Active | Node Management |
| Node details | `/nodes/:id` | GET | ✅ Active | Node details view |
| Create node | `/nodes` | POST | ✅ Active | Node Management |
| Update node | `/nodes/:id` | PUT | ✅ Active | Node Management |
| Delete node | `/nodes/:id` | DELETE | ✅ Active | Node Management |
| **Channels** |
| List channels | `/channels` | GET | ✅ Active | External API Integration |
| Create channel | `/channels` | POST | ✅ Active | Channel Management |
| Channel stats | `/channels/:id/stats` | GET | ✅ Active | Channel Analytics |
| **Contracts** |
| List contracts | `/contracts/ricardian` | GET | ✅ Active | RicardianContracts |
| Upload contract | `/contracts/ricardian/upload` | POST | ✅ Active | Contract Upload |
| Execute contract | `/contracts/ricardian/:id/execute` | POST | ✅ Active | Contract Execution |
| Contract statistics | `/contracts/statistics` | GET | ✅ Active | Contract Analytics |
| **Demos** |
| List demos | `/demos` | GET | ✅ Active | Dashboard, RicardianContracts (96 records) |
| Create demo | `/demos` | POST | 📋 Planned | Demo Management |
| Start demo | `/demos/:id/start` | PUT | 📋 Planned | Demo Control |
| Stop demo | `/demos/:id/stop` | PUT | 📋 Planned | Demo Control |
| Delete demo | `/demos/:id` | DELETE | 📋 Planned | Demo Management |
| Merkle proof | `/demos/:id/merkle` | GET | 📋 Planned | Demo Verification |
| **AI/ML** (NEW - MISSING IMPLEMENTATION) |
| AI Metrics | `/ai/metrics` | GET | ✅ Active | ML Performance Dashboard |
| AI Predictions | `/ai/predictions` | GET | ✅ Active | ML Performance Dashboard |
| **ML Performance** | `/ai/performance` | GET | ❌ Missing | ML Performance Dashboard (line 26) |
| **Confidence Scores** | `/ai/confidence` | GET | ❌ Missing | ML Performance Dashboard (line 27) |
| **Tokens & RWAT** (NEW - MISSING IMPLEMENTATION) |
| List tokens | `/tokens` | GET | ❌ Missing | TokenManagement (src/pages/rwa/TokenManagement.tsx) |
| Create token | `/tokens` | POST | ❌ Missing | TokenManagement |
| Token details | `/tokens/:id` | GET | ❌ Missing | Token details view |
| Update token | `/tokens/:id` | PUT | ❌ Missing | Token Management |
| Token statistics | `/tokens/statistics` | GET | ❌ Missing | Token Analytics |
| **System** |
| Health check | `/health` | GET | ✅ Active | System Health |
| System info | `/info` | GET | ✅ Active | Developer Dashboard |
| Metrics | `/metrics` | GET | ✅ Active | Monitoring |

---

### API Integration Status

**Total Endpoints**: 22 (updated)
**Working**: 14 endpoints (64%)
**Missing**: 4 endpoints (18%)
**Planned**: 4 endpoints (18%)

**Critical Missing Endpoints**:
1. `/api/v11/ai/performance` - Used by ML Performance Dashboard
2. `/api/v11/ai/confidence` - Used by ML Performance Dashboard
3. `/api/v11/tokens` - Used by Token Management component
4. `/api/v11/tokens/statistics` - Used by Token Management component

### UI Component to API Endpoint Mapping

| Component | File | Endpoints Used | Status |
|-----------|------|-----------------|--------|
| Dashboard | `src/pages/Dashboard.tsx` | `/blockchain/stats`, `/performance`, `/system/status`, `/demos` | ✅ Working |
| Transactions | `src/pages/Transactions.tsx` | `/blockchain/transactions` | ✅ Working |
| Analytics | `src/pages/Analytics.tsx` | `/blockchain/stats`, `/performance` | ✅ Working |
| DeveloperDashboard | `src/pages/dashboards/DeveloperDashboard.tsx` | `/info`, `/performance` | ✅ Working |
| MLPerformanceDashboard | `src/pages/dashboards/MLPerformanceDashboard.tsx` | `/ai/metrics`, `/ai/predictions`, ❌ `/ai/performance`, ❌ `/ai/confidence` | ⚠️ Partial |
| BlockchainOperations | `src/pages/dashboards/BlockchainOperations.tsx` | `/blockchain/blocks`, `/blockchain/stats` | ✅ Working |
| RicardianContracts | `src/pages/dashboards/RicardianContracts.tsx` | `/demos` (fixed in v4.8.0) | ✅ Working |
| SecurityAudit | `src/pages/dashboards/SecurityAudit.tsx` | `/blockchain/stats` | ✅ Working |
| SystemHealth | `src/pages/dashboards/SystemHealth.tsx` | `/health`, `/analytics/performance` | ✅ Working |
| ExternalAPIIntegration | `src/pages/dashboards/ExternalAPIIntegration.tsx` | `/channels` | ✅ Working |
| OracleService | `src/pages/dashboards/OracleService.tsx` | `/blockchain/stats` | ✅ Working |
| TokenManagement | `src/pages/rwa/TokenManagement.tsx` | ❌ `/tokens`, ❌ `/tokens/statistics` | ❌ Missing Endpoints |

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internet (Public)                             │
│                    Port 443 (HTTPS)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ DNS: dlt.aurigraph.io
                             │ IP: 151.242.51.55
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                Ubuntu 24.04.3 LTS Server                         │
│                (16 vCPU, 49Gi RAM, 133G Disk)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              NGINX (Port 443 - HTTPS)                     │  │
│  │  - SSL: /etc/letsencrypt/live/dlt.aurigraph.io-0001/     │  │
│  │  - Config: /etc/nginx/sites-available/aurigraph-portal   │  │
│  │  - Static files: /opt/aurigraph-v11/enterprise-portal/   │  │
│  │  - Reverse proxy to backend (port 9003)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Aurigraph V11 Backend (Port 9003)                  │  │
│  │  - Process: Java -jar aurigraph-v11-standalone.jar       │  │
│  │  - PID: 317732 (systemd managed)                         │  │
│  │  - Logs: /opt/aurigraph-v11/logs/                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Monitoring Stack (Planned)                   │  │
│  │  - Prometheus (port 9090)                                │  │
│  │  - Grafana (port 3000, proxied at /grafana/)             │  │
│  │  - Node Exporter (port 9100)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### NGINX Configuration

```nginx
# /etc/nginx/sites-available/aurigraph-portal

server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io-0001/privkey.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Static files (Enterprise Portal)
    location / {
        root /opt/aurigraph-v11/enterprise-portal;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy (when implemented)
    location /ws {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}
```

### Build Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    Local Development                          │
│  npm run dev (Vite dev server, port 3000)                    │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ npm run build
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Build Process                              │
│  1. TypeScript compilation (tsc)                             │
│  2. Vite bundling and optimization                           │
│  3. Asset optimization                                        │
│  4. Code splitting                                            │
│  5. Production build → dist/                                  │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ scp dist/* remote:
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Production Server                          │
│  1. Upload to /tmp/ep-build-{timestamp}/                     │
│  2. Backup existing: /opt/aurigraph-v11/enterprise-portal    │
│  3. Deploy new build                                          │
│  4. Verify deployment (curl https://dlt.aurigraph.io/)       │
│  5. Rollback if errors                                        │
└──────────────────────────────────────────────────────────────┘
```

### Deployment Commands

```bash
# Local build
npm run build

# Upload to server
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sshpass -p 'PASSWORD' scp -r dist/* \
  subbu@dlt.aurigraph.io:/tmp/ep-build-${TIMESTAMP}/

# Remote deployment
sshpass -p 'PASSWORD' ssh subbu@dlt.aurigraph.io << 'EOF'
  TIMESTAMP=$(ls -t /tmp/ep-build-* | head -1 | cut -d'-' -f3)
  sudo cp -r /opt/aurigraph-v11/enterprise-portal \
    /opt/aurigraph-v11/enterprise-portal.backup.${TIMESTAMP}
  sudo mv /tmp/ep-build-${TIMESTAMP}/* \
    /opt/aurigraph-v11/enterprise-portal/
  sudo systemctl reload nginx
EOF

# Verify deployment
curl -I https://dlt.aurigraph.io/
```

---

## Security Architecture

### Transport Security
- **Protocol**: HTTPS only (TLS 1.3)
- **Certificate**: Let's Encrypt (auto-renewed)
- **Cipher Suites**: Modern, strong ciphers only
- **HSTS**: Enabled with 1-year max-age
- **Certificate Pinning**: Planned

### Application Security

#### Input Validation
```typescript
// Example: Address validation in Transactions.tsx
const formatAddress = (address: string | undefined | null) => {
  // Null/undefined check
  if (!address || typeof address !== 'string') return 'N/A';

  // Length validation
  if (address.length < 10) return address;

  // Format validation (hex string)
  if (!/^0x[a-fA-F0-9]+$/.test(address)) return 'Invalid';

  // Safe formatting
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
```

#### XSS Prevention
- React escapes all content by default
- `dangerouslySetInnerHTML` avoided
- Content Security Policy headers
- Input sanitization for user-generated content

#### CSRF Protection (Planned)
- CSRF tokens for state-changing operations
- SameSite cookie attributes
- Double-submit cookie pattern

### Authentication & Authorization (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Login                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Keycloak (iam2.aurigraph.io)                        │
│  - OAuth 2.0 / OpenID Connect                                   │
│  - PKCE flow for browsers                                       │
│  - JWT token issuance                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ JWT Token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Enterprise Portal                              │
│  - Store JWT in localStorage (temporary)                        │
│  - Include in Authorization header                              │
│  - Auto-refresh before expiry                                   │
│  - Clear on logout                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Bearer {token}
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API (V11)                              │
│  - Validate JWT signature                                       │
│  - Check expiration                                             │
│  - Extract user claims                                          │
│  - Enforce RBAC (admin, user, viewer, operator)                │
└─────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control (Planned)

| Role | Dashboard | Transactions | Nodes | Channels | Contracts | Demos | Admin |
|------|-----------|--------------|-------|----------|-----------|-------|-------|
| **Admin** | Full | Full | Full | Full | Full | Full | Full |
| **Operator** | Read | Full | Full | Full | Read | Full | None |
| **User** | Read | Read | Read | Read | Read | Read | None |
| **Viewer** | Read | Read | None | None | None | Read | None |

---

## Performance Architecture

### Performance Optimization Strategies

#### 1. Code Splitting
```typescript
// Lazy loading for pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const DemoApp = lazy(() => import('./DemoApp'));

// Route-based code splitting
<Routes>
  <Route path="/" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
  <Route path="/transactions" element={<Suspense fallback={<Loading />}><Transactions /></Suspense>} />
  <Route path="/demos" element={<Suspense fallback={<Loading />}><DemoApp /></Suspense>} />
</Routes>
```

#### 2. Memoization
```typescript
// Expensive computation memoization
const formattedTransactions = useMemo(() => {
  return transactions.map(tx => ({
    ...tx,
    formattedAmount: formatCurrency(tx.amount),
    formattedDate: formatDate(tx.timestamp),
  }));
}, [transactions]);

// Component memoization
const TransactionRow = React.memo(({ transaction }) => {
  return <TableRow>...</TableRow>;
});
```

#### 3. Virtual Scrolling
```typescript
// MUI DataGrid with virtualization
<DataGrid
  rows={transactions}
  columns={columns}
  pageSize={50}
  rowsPerPageOptions={[50, 100, 200]}
  disableVirtualization={false}  // Enable virtualization
  density="compact"
/>
```

#### 4. API Request Optimization
```typescript
// Debounced search
const debouncedSearch = useMemo(
  () => debounce((query) => fetchTransactions(query), 300),
  []
);

// Request cancellation
useEffect(() => {
  const abortController = new AbortController();

  fetchData({ signal: abortController.signal });

  return () => abortController.abort();
}, []);
```

#### 5. Caching Strategy
```typescript
// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

async function fetchWithCache(key, fetcher) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **First Contentful Paint** | <1.5s | ~1.2s | ✅ Met |
| **Time to Interactive** | <3.0s | ~2.5s | ✅ Met |
| **Largest Contentful Paint** | <2.5s | ~2.0s | ✅ Met |
| **Cumulative Layout Shift** | <0.1 | ~0.05 | ✅ Met |
| **Total Bundle Size** | <1MB | ~850KB | ✅ Met |
| **API Response (p95)** | <200ms | ~150ms | ✅ Met |

---

## Testing Architecture

### Test Pyramid

```
               ┌─────────────┐
              ╱  E2E Tests   ╲     5% - Critical user flows
             ╱   (Cypress)    ╲
            ╱─────────────────╲
           ╱  Integration      ╲   15% - Component integration
          ╱   Tests (Vitest)    ╲
         ╱───────────────────────╲
        ╱  Unit Tests (Vitest)    ╲  80% - Functions, components
       ╱─────────────────────────────╲
```

### Test Coverage Targets

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| **Overall** | 90% | 85% | 🚧 In Progress |
| **Services** | 95% | 90% | 🚧 In Progress |
| **Components** | 85% | 82% | 🚧 In Progress |
| **Utils** | 98% | 95% | ✅ Met |
| **Pages** | 75% | 78% | ✅ Met |

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── BlockchainService.test.ts
│   │   ├── NodeService.test.ts
│   │   └── DemoService.test.ts
│   │
│   ├── utils/
│   │   ├── formatters.test.ts
│   │   └── validators.test.ts
│   │
│   └── components/
│       ├── DemoRegistration.test.tsx
│       ├── DemoListView.test.tsx
│       └── NodeVisualization.test.tsx
│
├── integration/
│   ├── Dashboard.integration.test.tsx
│   ├── Transactions.integration.test.tsx
│   └── DemoFlow.integration.test.tsx
│
└── e2e/
    ├── demo-registration.e2e.ts
    ├── transaction-viewing.e2e.ts
    └── node-management.e2e.ts
```

### Testing Strategy

#### Unit Tests
```typescript
// Example: Service unit test
describe('DemoService', () => {
  it('should create demo with valid data', async () => {
    const mockDemo = { userName: 'Test', ... };
    const result = await DemoService.createDemo(mockDemo);

    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
    expect(result.status).toBe('PENDING');
  });

  it('should throw error for invalid demo data', async () => {
    const invalidDemo = { userName: '' };

    await expect(DemoService.createDemo(invalidDemo))
      .rejects.toThrow('Invalid demo data');
  });
});
```

#### Integration Tests
```typescript
// Example: Component integration test
describe('DemoRegistration Flow', () => {
  it('should complete full registration flow', async () => {
    render(<DemoRegistration open={true} onSubmit={mockSubmit} />);

    // Step 1: User Info
    await userEvent.type(screen.getByLabelText('Your Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Your Email'), 'john@test.com');
    await userEvent.click(screen.getByText('Next'));

    // Step 2: Channels
    await userEvent.type(screen.getByLabelText('Channel Name'), 'Main Channel');
    await userEvent.click(screen.getByText('Add Channel'));
    await userEvent.click(screen.getByText('Next'));

    // Step 3: Nodes
    await userEvent.type(screen.getByLabelText('Node Name'), 'Validator-1');
    await userEvent.click(screen.getByText('Add Node'));
    await userEvent.click(screen.getByText('Next'));

    // Step 4: Submit
    await userEvent.click(screen.getByText('Register Demo'));

    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

---

## Monitoring & Observability

### Logging Strategy

#### Client-Side Logging
```typescript
// Structured logging
const logger = {
  info: (message, context) => console.log('[INFO]', message, context),
  warn: (message, context) => console.warn('[WARN]', message, context),
  error: (message, error, context) => {
    console.error('[ERROR]', message, error, context);
    // Send to remote logging service (planned)
    // sendToLogService({ level: 'error', message, error, context });
  },
};

// Usage
logger.info('Demo created successfully', { demoId: demo.id });
logger.error('Failed to fetch transactions', error, { endpoint: '/api/v11/transactions' });
```

#### Server-Side Logging (Backend)
- Application logs: `/opt/aurigraph-v11/logs/application.log`
- Access logs: `/var/log/nginx/access.log`
- Error logs: `/var/log/nginx/error.log`
- Audit logs: `/opt/aurigraph-v11/logs/audit.log`

### Monitoring Stack (Planned)

```
┌──────────────────────────────────────────────────────────────┐
│                    Application Metrics                        │
│  - Response times                                             │
│  - Error rates                                                │
│  - User actions                                               │
│  - API calls                                                  │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ /api/v11/metrics (Prometheus format)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Prometheus (Port 9090)                     │
│  - Scrape interval: 15s                                       │
│  - Retention: 30 days                                         │
│  - Alert rules configured                                     │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ PromQL queries
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Grafana (Port 3000)                        │
│  - Enterprise Portal Dashboard                               │
│  - Backend Performance Dashboard                             │
│  - Infrastructure Dashboard                                  │
│  - Alert notifications (email, Slack)                        │
└──────────────────────────────────────────────────────────────┘
```

### Key Metrics to Monitor

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| **Performance** | Page load time | >3s |
| **Performance** | API response time | >500ms |
| **Reliability** | Error rate | >1% |
| **Reliability** | Uptime | <99.9% |
| **Usage** | Active users | - |
| **Usage** | Page views | - |
| **Backend** | CPU usage | >80% |
| **Backend** | Memory usage | >90% |
| **Backend** | Disk usage | >85% |
| **Backend** | TPS | <100K (warning) |

---

## Disaster Recovery

### Backup Strategy

#### Frontend Backups
```bash
# Automated daily backup
0 2 * * * /opt/scripts/backup-portal.sh

# Backup script
#!/bin/bash
BACKUP_DIR="/backup/enterprise-portal"
DATE=$(date +%Y%m%d)

# Backup current deployment
tar -czf ${BACKUP_DIR}/portal-${DATE}.tar.gz \
  /opt/aurigraph-v11/enterprise-portal/

# Backup NGINX config
tar -czf ${BACKUP_DIR}/nginx-config-${DATE}.tar.gz \
  /etc/nginx/sites-available/aurigraph-portal

# Keep last 30 days
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
```

#### Restore Procedure
```bash
# 1. Stop NGINX
sudo systemctl stop nginx

# 2. Restore portal files
cd /opt/aurigraph-v11/
sudo tar -xzf /backup/enterprise-portal/portal-20251019.tar.gz

# 3. Restore NGINX config
sudo tar -xzf /backup/enterprise-portal/nginx-config-20251019.tar.gz -C /

# 4. Restart NGINX
sudo systemctl start nginx

# 5. Verify
curl -I https://dlt.aurigraph.io/
```

### Recovery Time Objectives

| Component | RTO | RPO | Recovery Procedure |
|-----------|-----|-----|-------------------|
| **Portal UI** | <5 min | <24h | Restore from daily backup |
| **NGINX Config** | <2 min | <24h | Restore from daily backup |
| **SSL Certificates** | <10 min | N/A | Re-issue from Let's Encrypt |
| **Backend API** | <10 min | <1h | Restart service, restore DB |

---

## Appendix

### Technology Decisions

#### Why React?
- Component-based architecture for reusability
- Large ecosystem and community
- Excellent TypeScript support
- Virtual DOM for performance
- Rich library of UI components (MUI)

#### Why Material-UI?
- Comprehensive component library
- Professional, enterprise-grade design
- Excellent accessibility support
- Customizable theming
- Active maintenance and updates

#### Why Redux Toolkit?
- Simplified Redux with less boilerplate
- Built-in best practices (Immer, Thunk)
- Excellent TypeScript integration
- DevTools for debugging
- Normalized state management

#### Why Vite?
- Fast development server (ES modules)
- Instant Hot Module Replacement (HMR)
- Optimized production builds
- Simple configuration
- Native TypeScript support

### Future Enhancements

#### Short-term (Q4 2025)
- Complete demo system (node visualization, Merkle tree)
- WebSocket real-time updates
- OAuth 2.0 authentication
- Enhanced error handling

#### Medium-term (Q1 2026)
- Progressive Web App (PWA) capabilities
- Offline support with service workers
- Advanced analytics and reporting
- Custom dashboard builder
- Multi-language support (i18n)

#### Long-term (Q2+ 2026)
- Mobile app (React Native)
- Desktop app (Electron)
- AI-powered insights and recommendations
- White-label customization
- Multi-tenant architecture

---

## Document Control

**Author**: Aurigraph Architecture Team
**Reviewers**: Engineering Leadership, DevOps, Security
**Approvers**: CTO, Chief Architect
**Classification**: Internal/Confidential
**Next Review**: November 19, 2025

**Change Log**:
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 19, 2025 | Arch Team | Initial architecture document |

---

*End of Architecture Document*
