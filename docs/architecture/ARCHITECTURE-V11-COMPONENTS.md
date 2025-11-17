# Aurigraph V11 Components Architecture

**Version**: 11.1.0 | **Section**: Components | **Status**: 🟢 Production Ready
**Last Updated**: 2025-11-17 | **Related**: [ARCHITECTURE-MAIN.md](./ARCHITECTURE-MAIN.md)

---

## Core V11 Services

```java
io.aurigraph.v11
├── AurigraphResource.java          // Main REST API (46+ endpoints)
├── TransactionService.java         // Transaction processing & validation
├── ai/
│   ├── AIOptimizationService.java  // ML-based transaction ordering
│   ├── PredictiveTransactionOrdering.java
│   └── AnomalyDetectionService.java
├── consensus/
│   ├── HyperRAFTConsensusService.java
│   ├── LiveConsensusService.java
│   └── ConsensusOptimizer.java
├── crypto/
│   ├── QuantumCryptoService.java
│   ├── DilithiumSignatureService.java
│   └── KyberEncryptionService.java
├── bridge/
│   ├── CrossChainBridgeService.java
│   └── adapters/
│       ├── EthereumAdapter.java
│       ├── PolkadotAdapter.java
│       └── BitcoinAdapter.java
├── registry/
│   ├── RWATRegistryService.java
│   ├── MerkleTreeRegistry.java
│   └── ComplianceRegistryService.java
└── grpc/
    ├── AurigraphV11GrpcService.java
    └── HighPerformanceGrpcService.java
```

---

## Enterprise Portal (Frontend)

**Technology**: React 18 + TypeScript + Material-UI

### Architecture
```
enterprise-portal/
├── src/
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Analytics.tsx   # Analytics view
│   │   └── rwa/            # RWA tokenization UI
│   ├── components/         # Reusable components
│   ├── services/           # API services (auto-refresh 5s)
│   ├── store/              # Redux state management
│   └── hooks/              # Custom React hooks
├── public/
│   └── favicon.ico         # Aurigraph branded favicon
└── package.json
```

### Key Features
- Real-time data updates (WebSocket + polling)
- Material-UI design system
- Recharts for data visualization
- Axios for HTTP requests
- React Router for navigation
- Live API integration

### API Integration
- **Base URL**: `https://dlt.aurigraph.io/api/v11`
- **Auto-refresh**: 5-second intervals
- **Error Boundaries**: Resilience handling
- **Loading States**: UX enhancement

---

## IAM Service (Keycloak)

**Purpose**: Identity and Access Management
**Technology**: Keycloak 24.0+
**Port**: 8180

### Features
- Multi-realm support
- OAuth 2.0 / OpenID Connect
- Role-based access control (RBAC)
- SSO integration

### Realms
- **AWD**: Primary enterprise realm
- **AurCarbonTrace**: Carbon tracking application
- **AurHydroPulse**: Hydro monitoring application

---

## Service Interaction Patterns

### Transaction Processing Pipeline
```
Client Request
    ↓
API Gateway (Rate Limit, Auth)
    ↓
TransactionService (Validate, Sign)
    ↓
Transaction Pool (Priority Queue)
    ↓
HyperRAFT++ Consensus
    ↓
State Machine (Execute)
    ↓
Storage Layer (Persist)
    ↓
Response (REST/WebSocket)
```

### Data Flow
1. **Request**: Client submits transaction
2. **Validation**: Signature, nonce, balance checks
3. **Queuing**: Add to transaction pool
4. **Consensus**: HyperRAFT++ replication
5. **Execution**: Apply to state machine
6. **Persistence**: Store in PostgreSQL/RocksDB
7. **Notification**: Send via WebSocket/REST

---

## Database Entities

### Primary Entities
- **Transaction**: Core transaction data
- **Block**: Block structure and metadata
- **Account**: User accounts and balances
- **Contract**: Smart contract deployments
- **Registry**: RWA registry entries
- **Compliance**: Compliance tracking

### Repositories
- TransactionRepository
- BlockRepository
- AccountRepository
- ContractRepository
- RegistryRepository
- ComplianceRepository

---

## Cross-Chain Integration

### Supported Networks
- Ethereum (EVM-compatible)
- Polkadot (Substrate)
- Bitcoin (planned)
- Solana (planned)

### Bridge Architecture
- Bidirectional asset transfers
- Atomic swap (HTLC) support
- Multi-signature validation
- Event-driven architecture

---

## Performance Optimization

### Caching Strategy
- **Redis**: Transaction pool, merkle proofs (24h TTL)
- **Hazelcast**: Distributed consensus state
- **LevelDB**: Embedded state machine snapshots

### Parallelization
- **Virtual Threads**: Concurrent request handling
- **Reactive Streams**: Non-blocking I/O
- **Batch Processing**: Transaction batching

### Resource Management
- **Connection Pooling**: PostgreSQL + Redis
- **Thread Pools**: Configurable executor services
- **Memory Management**: GC optimization

---

## Deployment Components

### Docker Services (Production)
1. **nginx-gateway**: Reverse proxy & SSL/TLS
2. **postgres**: Primary database
3. **redis**: Cache & session store
4. **prometheus**: Metrics collection
5. **grafana**: Dashboard visualization
6. **portal**: Frontend (React build)
7. **aurigraph-v11**: API service

### Health Checks
- `/q/health` - Overall health
- `/q/health/ready` - Readiness probe
- `/q/health/live` - Liveness probe

---

**Navigation**: [Main](./ARCHITECTURE-MAIN.md) | [Technology Stack](./ARCHITECTURE-TECHNOLOGY-STACK.md) | [Components](./ARCHITECTURE-V11-COMPONENTS.md) ← | [APIs](./ARCHITECTURE-API-ENDPOINTS.md) | [Consensus](./ARCHITECTURE-CONSENSUS.md) | [Security](./ARCHITECTURE-CRYPTOGRAPHY.md)

🤖 Phase 2 Documentation Chunking
