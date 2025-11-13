# Aurigraph DLT Platform Architecture

**Version**: 11.1.0 (V11 Migration Progress)
**Status**: 🚧 Hybrid V10/V11 Architecture (42% migrated)
**Last Updated**: 2025-11-03

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [V10 Architecture (TypeScript - Legacy)](#v10-architecture-typescript---legacy)
4. [V11 Architecture (Java/Quarkus - Target)](#v11-architecture-javaquarkus---target)
5. [Migration Strategy](#migration-strategy)
6. [Component Architecture](#component-architecture)
7. [API Architecture](#api-architecture)
8. [Data Flow](#data-flow)
9. [Security Architecture](#security-architecture)
10. [Performance Architecture](#performance-architecture)
11. [Deployment Architecture](#deployment-architecture)
12. [Digital Twin Asset Tokenization (Composite Tokens)](#digital-twin-asset-tokenization-composite-tokens)
13. [Future Roadmap](#future-roadmap)

---

## Executive Summary

Aurigraph DLT is a high-performance blockchain platform transitioning from TypeScript (V10) to Java/Quarkus/GraalVM (V11) architecture to achieve:

- **Target Performance**: 2M+ TPS (currently 776K TPS in V11)
- **Consensus**: HyperRAFT++ with AI optimization
- **Security**: NIST Level 5 quantum-resistant cryptography
- **Interoperability**: Cross-chain bridge with major networks
- **Innovation**: AI-driven consensus optimization and real-world asset tokenization

### Current State (November 3, 2025)
- **V10 (TypeScript)**: Production-ready, 1M+ TPS capability (legacy support)
- **V11 (Java/Quarkus)**: 42% migrated, 776K TPS baseline achieved
- **V11 ML Optimization**: 3.0M TPS achieved in Sprint 5 benchmarks
- **Enterprise Portal**: v4.5.0 live at https://dlt.aurigraph.io
- **Both versions** coexist during migration period

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Aurigraph DLT Platform                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐         ┌────────────────────────┐         │
│  │   Enterprise Portal    │         │   Mobile Wallet App    │         │
│  │   (React/TypeScript)   │         │   (React Native)       │         │
│  │   Port: 3000           │         │                        │         │
│  └────────────┬───────────┘         └────────────┬───────────┘         │
│               │                                   │                      │
│               └───────────────┬───────────────────┘                      │
│                               │                                          │
│                ┌──────────────▼──────────────┐                          │
│                │      API Gateway            │                          │
│                │  (Kong/NGINX - Port 8080)   │                          │
│                └──────────────┬──────────────┘                          │
│                               │                                          │
│          ┌────────────────────┼────────────────────┐                    │
│          │                    │                    │                    │
│  ┌───────▼────────┐  ┌────────▼───────┐  ┌────────▼───────┐           │
│  │   V10 Legacy   │  │   V11 Primary  │  │  IAM Service   │           │
│  │  (TypeScript)  │  │ (Java/Quarkus) │  │   (Keycloak)   │           │
│  │   Port: 8080   │  │   Port: 9003   │  │  Port: 8180    │           │
│  └───────┬────────┘  └────────┬───────┘  └────────────────┘           │
│          │                    │                                          │
│          └────────────────────┼─────────────────────┐                   │
│                               │                     │                   │
│              ┌────────────────▼───────────┐    ┌────▼───────┐          │
│              │   Core Blockchain Layer    │    │   Oracle   │          │
│              │  - HyperRAFT++ Consensus   │    │  Services  │          │
│              │  - Transaction Processing  │    │            │          │
│              │  - State Management        │    └────────────┘          │
│              └────────────────┬───────────┘                             │
│                               │                                          │
│              ┌────────────────▼───────────┐                             │
│              │   Storage & Persistence    │                             │
│              │  - PostgreSQL (Metadata)   │                             │
│              │  - RocksDB (State)         │                             │
│              │  - IPFS (Documents)        │                             │
│              └────────────────────────────┘                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## V10 Architecture (TypeScript - Legacy)

### Overview
V10 is the current production system built on Node.js/TypeScript, delivering 1M+ TPS with proven stability.

### Technology Stack

**Core**:
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Framework**: Custom blockchain framework
- **Build**: npm + tsc

**Key Components**:
- **Consensus**: HyperRAFT++ (TypeScript implementation)
- **Crypto**: CRYSTALS-Dilithium/Kyber (BouncyCastle)
- **Networking**: Custom P2P with encrypted channels
- **State**: In-memory with periodic persistence

### Architecture Layers

```
┌─────────────────────────────────────────┐
│        API Layer (REST/WebSocket)        │
│         src/api/RestAPI.ts               │
├─────────────────────────────────────────┤
│       Business Logic Layer               │
│  - Transaction Processing                │
│  - Smart Contract Execution              │
│  - Validation & Verification             │
├─────────────────────────────────────────┤
│        Consensus Layer                   │
│  - HyperRAFT++ Leader Election           │
│  - Log Replication                       │
│  - AI Optimization                       │
├─────────────────────────────────────────┤
│        Cryptography Layer                │
│  - Quantum-Resistant Signing             │
│  - Key Management                        │
│  - Zero-Knowledge Proofs                 │
├─────────────────────────────────────────┤
│        Network Layer                     │
│  - P2P Communication                     │
│  - Message Routing                       │
│  - Discovery & Gossip                    │
├─────────────────────────────────────────┤
│        Storage Layer                     │
│  - Block Storage                         │
│  - State Database                        │
│  - Transaction Pool                      │
└─────────────────────────────────────────┘
```

### Key Modules

**Consensus** (`src/consensus/`):
- `HyperRAFTPlusPlus.ts` - Consensus algorithm
- `LeaderElection.ts` - Leader election logic
- `LogReplication.ts` - Log replication
- `ConsensusOptimizer.ts` - AI optimization

**Cryptography** (`src/crypto/`):
- `QuantumCrypto.ts` - Post-quantum cryptography
- `DilithiumSigner.ts` - Digital signatures
- `KyberEncryption.ts` - Encryption
- `ZeroKnowledgeProofs.ts` - Privacy features

**AI/ML** (`src/ai/`):
- `ConsensusPredictor.ts` - ML-based optimization
- `AnomalyDetector.ts` - Transaction anomaly detection
- `ShardOptimizer.ts` - Shard assignment optimization

**Cross-Chain** (`src/crosschain/`):
- `BridgeService.ts` - Bridge orchestration
- `EthereumAdapter.ts` - Ethereum integration
- `PolkadotAdapter.ts` - Polkadot integration

### Performance Metrics (V10)
- **TPS**: 1M+ sustained
- **Finality**: <500ms
- **Block Time**: 1-3 seconds
- **Memory**: 512MB - 2GB
- **CPU**: Multi-core utilization >80%

---

## V11 Architecture (Java/Quarkus - Target)

### Overview
V11 is the next-generation architecture leveraging Java 21, Quarkus, and GraalVM for superior performance and native compilation.

### Technology Stack

**Core**:
- **Runtime**: Java 21 (Virtual Threads)
- **Framework**: Quarkus 3.26.2
- **Compilation**: GraalVM native image
- **Build**: Maven 3.9+

**Key Technologies**:
- **Reactive Programming**: Mutiny (reactive streams)
- **HTTP/2**: TLS 1.3 with ALPN
- **gRPC**: Protocol Buffers for service communication
- **Native Image**: Sub-second startup, <256MB memory

### Architecture Layers

```
┌─────────────────────────────────────────┐
│     REST API Layer (Quarkus RESTEasy)    │
│     io.aurigraph.v11.AurigraphResource   │
│         Port 9003 (HTTP/2)               │
├─────────────────────────────────────────┤
│      gRPC Service Layer (Port 9004)      │
│  io.aurigraph.v11.grpc.*                 │
│    - High-performance RPC                │
│    - Protocol Buffer serialization       │
├─────────────────────────────────────────┤
│       Business Services Layer            │
│  - TransactionService                    │
│  - ContractService                       │
│  - ValidationService                     │
├─────────────────────────────────────────┤
│        Consensus Layer                   │
│  io.aurigraph.v11.consensus              │
│  - HyperRAFTConsensusService             │
│  - LiveConsensusService                  │
│  - AI-driven optimization                │
├─────────────────────────────────────────┤
│       Cryptography Layer                 │
│  io.aurigraph.v11.crypto                 │
│  - QuantumCryptoService                  │
│  - DilithiumSignatureService             │
│  - Post-quantum encryption               │
├─────────────────────────────────────────┤
│     AI/ML Optimization Layer             │
│  io.aurigraph.v11.ai                     │
│  - AIOptimizationService                 │
│  - PredictiveTransactionOrdering         │
│  - AnomalyDetectionService               │
├─────────────────────────────────────────┤
│      Cross-Chain Bridge Layer            │
│  io.aurigraph.v11.bridge                 │
│  - CrossChainBridgeService               │
│  - Chain-specific adapters               │
├─────────────────────────────────────────┤
│    Real-World Asset Registry Layer       │
│  io.aurigraph.v11.registry               │
│  - RWATRegistryService                   │
│  - MerkleTreeRegistry                    │
├─────────────────────────────────────────┤
│         Storage & Persistence            │
│  - Reactive PostgreSQL (Panache)         │
│  - RocksDB for state                     │
│  - S3-compatible object storage          │
└─────────────────────────────────────────┘
```

### Key Services

**Core Services**:
```java
io.aurigraph.v11
├── AurigraphResource.java          // Main REST API
├── TransactionService.java         // Transaction processing
├── ai/
│   ├── AIOptimizationService.java  // ML optimization
│   ├── PredictiveTransactionOrdering.java
│   └── AnomalyDetectionService.java
├── consensus/
│   ├── HyperRAFTConsensusService.java
│   └── LiveConsensusService.java
├── crypto/
│   ├── QuantumCryptoService.java
│   └── DilithiumSignatureService.java
├── bridge/
│   ├── CrossChainBridgeService.java
│   └── adapters/
│       ├── EthereumAdapter.java
│       ├── PolkadotAdapter.java
│       └── BitcoinAdapter.java
├── registry/
│   ├── RWATRegistryService.java
│   └── MerkleTreeRegistry.java
└── grpc/
    ├── AurigraphV11GrpcService.java
    └── HighPerformanceGrpcService.java
```

### Native Compilation Profiles

1. **`-Pnative-fast`** (Development)
   - Build time: ~2 minutes
   - Optimization: -O1
   - Use case: Rapid iteration

2. **`-Pnative`** (Standard Production)
   - Build time: ~15 minutes
   - Optimization: -O2
   - Use case: Production deployment

3. **`-Pnative-ultra`** (Ultra-Optimized)
   - Build time: ~30 minutes
   - Optimization: -O3 + -march=native
   - Use case: Maximum performance

### Performance Metrics (V11 Current - November 2025)
- **TPS Baseline**: 776K TPS (production baseline, verified)
- **TPS with ML Optimization**: 3.0M TPS (Sprint 5 benchmarks, not yet sustained)
- **TPS Target**: 2M+ (roadmap goal)
- **Startup**: <1s (native), ~3s (JVM) ✅
- **Memory**: <256MB (native), ~512MB (JVM) ✅
- **Finality**: <500ms current, <100ms target (with optimization)
- **Throughput**: HTTP/2 + Polling (WebSocket in progress)
- **Carbon Footprint**: <0.17 gCO₂/tx (target, tracking implemented)

### V11 Multi-Cloud Deployment Architecture

**Node Type Specialization**:

**Validator Nodes** (Consensus):
- **Resources**: 16-32 CPU cores, 4-8GB RAM, 100GB SSD
- **Capacity**: 4-8 nodes per container
- **Role**: Consensus participation, full state storage
- **Deployment**: Multi-cloud (AWS/Azure/GCP)

**Business Nodes** (API Serving):
- **Resources**: 8-16 CPU cores, 2-4GB RAM, 50GB SSD
- **Capacity**: 4-10 nodes per container
- **Role**: Transaction processing, public API serving
- **Deployment**: Regional (near user populations)

**Slim Nodes** (Read-Only):
- **Resources**: 4-8 CPU cores, 1-2GB RAM, 20GB SSD
- **Capacity**: 6-12 nodes per container
- **Role**: Read-only queries, analytics
- **Deployment**: Global edge locations

**Multi-Cloud Topology**:
```
┌────────────────── Multi-Cloud Network ──────────────────┐
│                                                          │
│  AWS (us-east-1)      Azure (eastus)      GCP (us-c1)   │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐  │
│  │Validator │◄───────┤Validator │◄───────┤Validator │  │
│  │ 4 nodes  │  VPN   │ 4 nodes  │  VPN   │ 4 nodes  │  │
│  └──────────┘        └──────────┘        └──────────┘  │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐  │
│  │Business  │        │Business  │        │Business  │  │
│  │ 6 nodes  │        │ 6 nodes  │        │ 6 nodes  │  │
│  └──────────┘        └──────────┘        └──────────┘  │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐  │
│  │  Slim    │        │  Slim    │        │  Slim    │  │
│  │ 12 nodes │        │ 12 nodes │        │ 12 nodes │  │
│  └──────────┘        └──────────┘        └──────────┘  │
│                                                          │
│  Service Discovery: Consul (cross-cloud federation)     │
│  VPN Mesh: WireGuard (secure inter-cloud)              │
│  Orchestration: Kubernetes (HPA/VPA)                    │
│  Load Balancing: GeoDNS (geoproximity routing)         │
│                                                          │
│  Aggregate TPS: 2M+ | Cross-Cloud Latency: <50ms       │
└──────────────────────────────────────────────────────────┘
```

### Carbon Footprint Tracking Architecture

**Purpose**: Track and report carbon emissions for every transaction

**Architecture Components**:

```
┌─────────────────────────────────────────────────────┐
│            Carbon Tracking Architecture             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │        Transaction Processing Layer           │  │
│  │  - TransactionService.java                   │  │
│  │  - Collect: CPU time, network bytes, storage │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                 │
│                    ▼                                 │
│  ┌──────────────────────────────────────────────┐  │
│  │     CarbonFootprintService.java             │  │
│  │  - Calculate energy (CPU + Network +         │  │
│  │    Storage + Consensus)                      │  │
│  │  - Formula: Energy × Carbon Intensity        │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                 │
│         ┌──────────┴──────────┐                     │
│         ▼                     ▼                     │
│  ┌─────────────┐     ┌──────────────────┐          │
│  │GridCarbon   │     │ PostgreSQL DB    │          │
│  │Intensity    │     │ (Carbon Metrics) │          │
│  │Service      │     └──────────────────┘          │
│  │(Electricity │              │                     │
│  │ Maps API)   │              │                     │
│  └─────────────┘              │                     │
│                                ▼                     │
│  ┌──────────────────────────────────────────────┐  │
│  │        Carbon REST API Layer                 │  │
│  │  GET /api/v11/carbon/transaction/{txId}      │  │
│  │  GET /api/v11/carbon/block/{blockNumber}     │  │
│  │  GET /api/v11/carbon/stats                   │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                 │
│         ┌──────────┴──────────┐                     │
│         ▼                     ▼                     │
│  ┌─────────────┐     ┌──────────────────┐          │
│  │  Grafana    │     │  Carbon Offset   │          │
│  │  Dashboard  │     │  Integration     │          │
│  │  (7 panels) │     │  (Gold Standard) │          │
│  └─────────────┘     └──────────────────┘          │
│                                                      │
│  Carbon Footprint: 0.022 gCO₂/tx                   │
│  Target: <0.17 gCO₂/tx ✅                           │
│  ESG Compliance: GRI, SASB, TCFD                    │
└─────────────────────────────────────────────────────┘
```

**Carbon Calculation Model**:
```java
public class CarbonFootprintService {
    public double calculateTransactionCarbon(Transaction tx, ProcessingMetrics metrics) {
        // Energy components
        double cpuEnergy = (metrics.cpuSeconds * TDP_WATTS) / 3600 / 1000;
        double networkEnergy = (tx.sizeBytes * validators * ENERGY_PER_BYTE) / 1000;
        double storageEnergy = (tx.sizeBytes * ENERGY_PER_BYTE_YEAR * 10) / 1000;
        double consensusEnergy = (consensusRounds * validators * ROUND_ENERGY) / 1000;

        double totalEnergy = cpuEnergy + networkEnergy + storageEnergy + consensusEnergy;

        // Get regional carbon intensity
        CarbonIntensity intensity = gridCarbonService.getCurrentIntensity(metrics.region);

        // Calculate carbon footprint
        return totalEnergy * intensity.gCO2PerKWh;
    }
}
```

---

## Migration Strategy

### Phase-Based Approach (Updated November 2025)

```
Phase 1 (Complete - 42%)      Phase 2 (In Progress)     Phase 3 (Planned)
┌─────────────────┐           ┌─────────────────┐      ┌─────────────────┐
│ Core Structure  │  ───────> │ Service Layer   │ ───> │ Full Migration  │
│ - REST API      │           │ - Consensus     │      │ - gRPC Complete │
│ - Basic Tx      │           │ - Crypto        │      │ - Native Opt    │
│ - Health        │           │ - AI/ML ✓       │      │ - 2M+ TPS       │
│ - JWT Auth ✓    │           │ - Portal ✓      │      │ - Multi-Cloud   │
└─────────────────┘           └─────────────────┘      └─────────────────┘
    100% Complete              50% Complete             0% Complete

    Completed:                In Progress:             Pending:
    ✅ Core REST API          🚧 gRPC service         📋 Full optimization
    ✅ Tx processing          🚧 Consensus tuning     📋 Cross-cloud failover
    ✅ JWT Authentication     🚧 WebSocket support    📋 Kubernetes orchestration
    ✅ AI/ML optimization     🚧 Oracle integration   📋 E2E testing
    ✅ Enterprise Portal      🚧 RWA tokenization    📋 Performance validation
    ✅ Demo Management        🚧 Carbon tracking      📋 Carbon offset integration
    ✅ Quantum Crypto (95%)    🚧 Multi-cloud setup
```

### Migration Checklist

**Phase 1 - Foundation** ✅ (100%)
- [x] Quarkus project structure
- [x] REST API endpoints
- [x] Basic transaction service
- [x] Health check endpoints
- [x] Native compilation setup
- [x] Performance testing framework

**Phase 2 - Core Services** 🚧 (50% - Updated November 2025)
- [x] HyperRAFT++ consensus (70% - AI optimization pending)
- [x] AI optimization services (90% - online learning pending)
- [x] RWAT registry with Merkle tree (80% - oracle integration partial)
- [x] Native build optimization (complete)
- [x] JWT-based authentication (complete)
- [x] Enterprise Portal v4.5.0 (complete)
- [x] Demo management system (95%)
- [x] Quantum crypto (95% - SPHINCS+ integration pending)
- [ ] gRPC service layer (Sprint 7 target)
- [ ] WebSocket support (in progress, console errors being fixed)
- [ ] Full consensus migration (Sprint 6 target)
- [ ] Cross-chain bridge (partial - Ethereum working)
- [ ] E2E testing framework (Sprint 14-15 target)

**Phase 3 - Full Production** 📋 (0% - Updated November 2025)
- [ ] Complete gRPC implementation (Sprint 7-8)
- [ ] 2M+ TPS achievement (performance roadmap needed)
- [ ] Multi-cloud deployment (Azure, GCP - Sprint 14-15)
- [ ] Full test suite (95% coverage, currently 60-85%)
- [ ] Production deployment with auto-scaling
- [ ] Carbon offset integration (Sprint 16-18)
- [ ] V10 deprecation timeline

### Parallel Operation Strategy

During migration, both V10 and V11 run in parallel:

```
                User Requests
                      │
                      ▼
              ┌───────────────┐
              │  API Gateway  │
              │   (Kong)      │
              └───────┬───────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    ┌─────────┐           ┌─────────────┐
    │ V10 API │           │  V11 API    │
    │ (8080)  │           │  (9003)     │
    └─────────┘           └─────────────┘
          │                       │
          └───────────┬───────────┘
                      │
              ┌───────▼────────┐
              │ Shared Storage │
              │  (PostgreSQL)  │
              └────────────────┘
```

**Traffic Routing**:
- Legacy endpoints → V10
- New features → V11
- Gradual cutover with feature flags

---

## Component Architecture

### Enterprise Portal (Frontend)

**Technology**: React 18 + TypeScript + Material-UI

**Architecture**:
```
enterprise-portal/
├── src/
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Analytics.tsx   # Analytics view
│   │   ├── dashboards/     # Specialized dashboards
│   │   └── rwa/            # RWA tokenization
│   ├── components/         # Reusable components
│   │   ├── Layout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── MultiChannelDashboard.tsx
│   ├── services/           # API services
│   │   └── api.ts          # Backend API client
│   ├── store/              # State management
│   │   └── slices/
│   └── hooks/              # Custom React hooks
├── public/
└── package.json
```

**Key Features**:
- Real-time data updates (WebSocket + polling)
- Material-UI design system
- Recharts for data visualization
- Axios for HTTP requests
- React Router for navigation

**API Integration**:
- Base URL: `https://dlt.aurigraph.io/api/v11`
- Auto-refresh: 5-second intervals
- Error boundaries for resilience
- Loading states for UX

### IAM Service (Keycloak)

**Purpose**: Identity and Access Management
**Technology**: Keycloak 24.0+
**Port**: 8180

**Features**:
- Multi-realm support (AWD, AurCarbonTrace, AurHydroPulse)
- OAuth 2.0 / OpenID Connect
- Role-based access control (RBAC)
- SSO integration

**Realms**:
- **AWD**: Primary enterprise realm
- **AurCarbonTrace**: Carbon tracking application
- **AurHydroPulse**: Hydro monitoring application

---

## API Architecture

### V11 REST API Endpoints

**Base URL**: `https://dlt.aurigraph.io/api/v11`

**Core Endpoints**:
```
GET  /health                        # Health check
GET  /info                          # System information
GET  /performance                   # Performance test
GET  /stats                         # Transaction statistics

# Analytics
GET  /analytics/dashboard           # Dashboard analytics
GET  /analytics/performance         # Performance metrics
GET  /ai/predictions                # ML predictions
GET  /ai/performance                # AI performance metrics

# Blockchain
GET  /blockchain/transactions       # Transaction list (paginated)
GET  /blockchain/network/stats      # Network statistics
GET  /blockchain/operations         # Blockchain operations

# Nodes
GET  /nodes                         # Node list
GET  /nodes/{id}                    # Node details
PUT  /nodes/{id}/config             # Update node config

# Consensus
GET  /consensus/status              # Consensus state
GET  /live/consensus                # Real-time consensus data
GET  /consensus/metrics             # Consensus metrics

# Contracts
GET  /contracts                     # Smart contracts list
POST /contracts/deploy              # Deploy contract
GET  /contracts/statistics          # Contract statistics

# Security
GET  /security/audit                # Security audit log
GET  /security/threats              # Threat monitoring
GET  /security/metrics              # Security metrics

# Settings
GET  /settings/system               # System settings
PUT  /settings/system               # Update settings
GET  /settings/api-integrations     # API integration config
PUT  /settings/api-integrations     # Update API integrations

# Users
GET  /users                         # User list
POST /users                         # Create user
PUT  /users/{id}                    # Update user
DELETE /users/{id}                  # Delete user

# Backups
GET  /backups/history               # Backup history
POST /backups/create                # Trigger backup

# RWA (Real World Assets)
POST /rwa/tokenize                  # Tokenize asset
GET  /rwa/portfolio                 # Asset portfolio
GET  /rwa/valuation                 # Asset valuation
GET  /rwa/dividends                 # Dividend management
GET  /rwa/compliance                # Compliance tracking

# Oracle Service
GET  /oracle/status                 # Oracle service status
GET  /oracle/data-feeds             # Data feed list
GET  /oracle/verification           # Verification status

# External Integrations
GET  /integrations/alpaca           # Alpaca Markets status
GET  /integrations/twitter          # Twitter integration
GET  /integrations/weather          # Weather API status
```

### gRPC Services (Planned)

**Port**: 9004
**Protocol**: gRPC + Protocol Buffers

```protobuf
service AurigraphV11Service {
  rpc SubmitTransaction(Transaction) returns (TransactionReceipt);
  rpc GetBlockchainState(StateRequest) returns (BlockchainState);
  rpc StreamTransactions(StreamRequest) returns (stream Transaction);
  rpc GetConsensusStatus(Empty) returns (ConsensusStatus);
}
```

---

## Data Flow

### Transaction Processing Flow

```
┌──────────────┐
│   Client     │
│ (Enterprise  │
│   Portal)    │
└──────┬───────┘
       │ 1. Submit Transaction
       │ POST /api/v11/transactions
       ▼
┌──────────────────┐
│   API Gateway    │
│  Rate Limiting   │
│  Authentication  │
└──────┬───────────┘
       │ 2. Route to V11
       ▼
┌──────────────────┐
│ TransactionService│ ────┐
│   Validation     │      │ 3. Validate
│   Signature      │      │
└──────┬───────────┘      │
       │                   │
       │ 4. Queue          │
       ▼                   │
┌──────────────────┐      │
│ Transaction Pool │      │
│   (Priority Q)   │      │
└──────┬───────────┘      │
       │                   │
       │ 5. Consensus      │
       ▼                   │
┌──────────────────┐      │
│  HyperRAFT++     │<─────┘
│  - Leader Elect  │
│  - Log Replicate │
└──────┬───────────┘
       │ 6. Commit
       ▼
┌──────────────────┐
│  State Machine   │
│   - Execute      │
│   - Update State │
└──────┬───────────┘
       │ 7. Persist
       ▼
┌──────────────────┐
│  Storage Layer   │
│  - Block DB      │
│  - State DB      │
└──────┬───────────┘
       │ 8. Confirm
       ▼
┌──────────────────┐
│    Response      │
│  (WebSocket +    │
│   REST API)      │
└──────────────────┘
```

### Consensus Flow (HyperRAFT++)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Node 1    │     │   Node 2    │     │   Node 3    │
│  (Leader)   │     │ (Follower)  │     │ (Follower)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Receive Tx     │                   │
       │◄──────────────────┘                   │
       │                                        │
       │ 2. Append Log Entry                   │
       │                                        │
       │ 3. Replicate                          │
       ├──────────────────────────────────────>│
       ├──────────────────>│                   │
       │                   │                   │
       │ 4. ACK            │ 4. ACK            │
       │<──────────────────┤<──────────────────┤
       │                   │                   │
       │ 5. Commit (Quorum achieved)           │
       │                                        │
       │ 6. Notify Followers                   │
       ├──────────────────>│                   │
       ├──────────────────────────────────────>│
       │                   │                   │
       │ 7. Apply to State Machine             │
       ▼                   ▼                   ▼
```

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────┐
│         Application Layer Security              │
│  - Input validation                             │
│  - Output encoding                              │
│  - CSRF protection                              │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           API Layer Security                    │
│  - OAuth 2.0 / OpenID Connect                   │
│  - JWT tokens                                   │
│  - Rate limiting                                │
│  - API key validation                           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Transport Layer Security                │
│  - TLS 1.3                                      │
│  - HTTP/2 with ALPN                             │
│  - Certificate pinning                          │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│        Cryptography Layer Security              │
│  - CRYSTALS-Dilithium (signatures)              │
│  - CRYSTALS-Kyber (encryption)                  │
│  - NIST Level 5 quantum resistance              │
│  - Zero-knowledge proofs                        │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Consensus Layer Security                │
│  - Byzantine fault tolerance                    │
│  - Quorum-based validation                      │
│  - Sybil attack prevention                      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│          Network Layer Security                 │
│  - Encrypted P2P channels                       │
│  - DDoS protection                              │
│  - IP filtering                                 │
└─────────────────────────────────────────────────┘
```

### Quantum-Resistant Cryptography

**CRYSTALS-Dilithium** (Digital Signatures):
- Algorithm: Lattice-based cryptography
- Security Level: NIST Level 5
- Key Size: 2,592 bytes (public), 4,896 bytes (private)
- Signature Size: 3,309 bytes

**CRYSTALS-Kyber** (Encryption):
- Algorithm: Module-LWE
- Security Level: NIST Level 5
- Key Size: 1,568 bytes (public), 3,168 bytes (private)
- Ciphertext Size: 1,568 bytes

---

## Performance Architecture

### Target Performance Metrics

| Metric | V10 (Current) | V11 (Current) | V11 (Target) |
|--------|---------------|---------------|--------------|
| TPS | 1M+ | 776K | 2M+ |
| Finality | <500ms | <200ms | <100ms |
| Block Time | 1-3s | 1-2s | <1s |
| Startup Time | ~3s | <1s | <0.5s |
| Memory (Native) | N/A | <256MB | <128MB |
| Latency (p95) | <100ms | <50ms | <10ms |

### Optimization Strategies

**1. Virtual Threads (Java 21)**
```java
// Concurrent processing with virtual threads
executor.submit(() -> {
    Thread.startVirtualThread(() -> processTransaction(tx));
});
```

**2. Reactive Programming (Mutiny)**
```java
public Uni<Transaction> processAsync(Transaction tx) {
    return Uni.createFrom().item(() -> validate(tx))
        .onItem().transform(this::execute)
        .runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
}
```

**3. GraalVM Native Image**
- AOT compilation for instant startup
- Minimal memory footprint
- Optimized machine code

**4. Parallel Processing**
- Transaction validation parallelization
- Batch processing with configurable batch sizes
- Multi-threaded consensus

**5. AI-Driven Optimization**
- ML-based transaction ordering
- Predictive consensus optimization
- Anomaly-based priority adjustment

---

## Deployment Architecture

### Container Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Ingress Controller (NGINX)           │  │
│  │      TLS Termination & Load Balancing         │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────┴─────────────────────────────┐  │
│  │                                               │  │
│  │  ┌─────────────┐         ┌─────────────┐    │  │
│  │  │   V11 Pod   │         │  Portal Pod │    │  │
│  │  │  (Quarkus)  │         │   (Nginx)   │    │  │
│  │  │  Replicas:3 │         │  Replicas:2 │    │  │
│  │  └─────────────┘         └─────────────┘    │  │
│  │                                               │  │
│  │  ┌─────────────┐         ┌─────────────┐    │  │
│  │  │  IAM Pod    │         │  Oracle Pod │    │  │
│  │  │ (Keycloak)  │         │  (Custom)   │    │  │
│  │  │  Replicas:2 │         │  Replicas:3 │    │  │
│  │  └─────────────┘         └─────────────┘    │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │        StatefulSets (Persistent Storage)      │  │
│  │  ┌─────────────┐         ┌─────────────┐    │  │
│  │  │ PostgreSQL  │         │   RocksDB   │    │  │
│  │  │  Replicas:3 │         │  Replicas:3 │    │  │
│  │  └─────────────┘         └─────────────┘    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Deployment Environments

**Development** (`dev`):
- Single-node setup
- Hot reload enabled
- Debug mode
- Mock external services

**Staging** (`staging`):
- Multi-node setup
- Production-like configuration
- Integration testing
- Performance validation

**Production** (`prod`):
- **Multi-Cloud Deployment**: AWS + Azure + GCP
- **High Availability (HA)**: Survives single-cloud outage
- **Auto-Scaling**: Kubernetes HPA/VPA
- **Global Distribution**:
  - Validator nodes: 12 total (4 per cloud)
  - Business nodes: 18 total (6 per region)
  - Slim nodes: 36 total (12 per edge location)
- **Cross-Cloud Latency**: <50ms (validator-to-validator)
- **Global API Latency**: <200ms (via edge slim nodes)
- **Carbon Tracking**: Real-time monitoring and ESG reporting
- **Full Monitoring**: Prometheus + Grafana + Carbon Dashboard

### CI/CD Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Commit │────>│  Build  │────>│  Test   │────>│ Deploy  │
│  (Git)  │     │ (Maven) │     │ (JUnit) │     │  (K8s)  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                      │               │               │
                      │               │               │
                 Compile         Unit Tests      Blue-Green
                 Native          Integration     Deployment
                 Image           Performance
```

**Pipeline Stages**:
1. **Source** - Git push triggers build
2. **Build** - Maven compile + native image
3. **Test** - Unit, integration, performance tests
4. **Security Scan** - Vulnerability scanning
5. **Deploy** - Kubernetes rollout
6. **Verify** - Health checks and smoke tests
7. **Monitor** - Prometheus + Grafana

---

## Digital Twin Asset Tokenization (Composite Tokens)

### 5.1 Composite Token Framework

Composite Tokens extend the Aurigraph platform with a **hierarchical digital twin framework** for real-world assets, creating an immutable cryptographic chain linking physical assets to verified digital representations.

#### 5.1.1 Framework Overview

**Conceptual Architecture - 5-Layer Stack**:

```
┌──────────────────────────────────────────────────┐
│ EXECUTION LAYER (ActiveContract)                 │
│ - Contract terms, parties, states                │
│ - Bound to 1 Composite Token (1:1 binding)       │
│ - Status: PENDING → ACTIVE → EXECUTED            │
│ - Registry: ActiveContractMerkleRegistry         │
└──────────────┬───────────────────────────────────┘
               │ Bound To
               ▼
┌──────────────────────────────────────────────────┐
│ COMPOSITE TOKEN LAYER (Digital Twin Bundle)      │
│ - Created after 3rd-party oracle verification    │
│ - Contains: 1 Primary + N Secondary tokens       │
│ - Hash: Deterministic SHA-256 (digital twin)     │
│ - Merkle Root: 4-level tree structure            │
│ - Signature: CRYSTALS-Dilithium quantum key      │
│ - Registry: CompositeTokenMerkleRegistry         │
│ - Status: CREATED → VERIFIED → BOUND             │
└──────────────┬───────────────────────────────────┘
        ▲      │      ▲
        │      │      │
   Primary Secondary Binding
   Token  Tokens    Proof
        │      │      │
┌───────┴──────┴──────┴────────────────────────────┐
│ EVIDENCE LAYER                                   │
│ ┌────────────────────┐  ┌──────────────────────┐ │
│ │ PRIMARY TOKEN      │  │ SECONDARY TOKENS     │ │
│ ├────────────────────┤  ├──────────────────────┤ │
│ │ - Asset ID         │  │ - Tax receipts       │ │
│ │ - Owner KYC ID     │  │ - Government IDs     │ │
│ │ - Token Value      │  │ - Property photos    │ │
│ │ - Merkle Path      │  │ - Video verification │ │
│ │ - Status Enum      │  │ - 3rd-party certs    │ │
│ │ - Registry: TMR    │  │ - Registry: TMR      │ │
│ └────────────────────┘  └──────────────────────┘ │
│  All tokens linked in TokenMerkleRegistry        │
└──────────────┬────────────────────────────────────┘
               │ All Linked To
               ▼
┌──────────────────────────────────────────────────┐
│ ASSET LAYER (Real-World Asset)                   │
│ - Physical asset metadata                        │
│ - Type, location, condition, documentation       │
│ - Owner/custodian information                    │
│ - IoT sensor data (if applicable)                │
│ - Registry: AssetMerkleRegistry                  │
│ - Linked to Primary Token (1:1)                  │
└──────────────────────────────────────────────────┘
```

#### 5.1.2 Composite Token Lifecycle

**State Transition Machine**:

```
CREATION PHASE:
  PRIMARY TOKEN CREATED (asset → KYC-verified primary token)
    ↓
  SECONDARY TOKENS UPLOADED (documents, photos, videos, certs)
    ↓
  SECONDARY TOKENS VERIFIED (oracle verifies each document)
    ↓

VERIFICATION PHASE:
  COMPOSITE TOKEN CREATED (deterministic hash computed)
    ↓
  ORACLE VERIFIES COMPOSITE (validates merkle tree integrity)
    ↓
  COMPOSITE VERIFIED (oracle CRYSTALS-Dilithium signature added)
    ↓

BINDING PHASE:
  AWAITING CONTRACT SELECTION (verified composite ready)
    ↓
  BOUND TO CONTRACT (1:1 link with ActiveContract)
    ↓

EXECUTION PHASE:
  CONTRACT ACTIVE (parties execute against digital twin)
    ↓
  CONTRACT EXECUTED (immutable final record)
```

#### 5.1.3 Merkle Tree Architecture (Triple Registry)

**Registry 1: Asset Registry** (Enhanced)
```
Merkle Tree Structure:
├─ Root (SHA-256 of all assets)
├─ Branch 1 (Real Estate)
│  ├─ Leaf: Asset-001 (Property A) → Primary Token-001 → Composite-001
│  ├─ Leaf: Asset-002 (Property B) → Primary Token-002 → Composite-002
│  └─ Leaf: Asset-003 (Property C)
├─ Branch 2 (Carbon Credits)
│  └─ ... (similar structure)
└─ Branch 3 (Commodities)
   └─ ... (similar structure)
```

**Registry 2: Token Merkle Registry** (Enhanced)
```
Merkle Tree Structure:
├─ Root (SHA-256 of all tokens)
├─ Primary Tokens Subtree
│  ├─ Leaf: Token-001 (for Asset-001)
│  ├─ Leaf: Token-002 (for Asset-002)
│  └─ Leaf: Token-003 (for Asset-003)
├─ Secondary Tokens Subtree
│  ├─ Leaf: SecToken-001-001 (Tax receipt for Token-001)
│  ├─ Leaf: SecToken-001-002 (Gov ID for Token-001)
│  ├─ Leaf: SecToken-001-003 (Photo for Token-001)
│  ├─ Leaf: SecToken-002-001 (Certificate for Token-002)
│  └─ ... (all secondary tokens)
└─ Extensions:
   ├─ Primary token status tracking
   ├─ Secondary token verification status
   └─ Binding to composite tokens
```

**Registry 3: Composite Token Merkle Registry** (NEW)
```
Merkle Tree Structure (4-Level):
├─ Root (Master merkle root of all composites)
├─ Composite Token 1 (Digital Twin for Asset-001)
│  ├─ Level 1: Primary Token-001 hash
│  ├─ Level 2: Secondary Tokens Merkle Root
│  │  ├─ Tax Receipt hash
│  │  ├─ Gov ID hash
│  │  ├─ Photo hash
│  │  └─ Video hash
│  ├─ Level 3: Contract Binding hash (if bound)
│  └─ Level 4: Composite Root Hash
├─ Composite Token 2 (Digital Twin for Asset-002)
│  └─ ... (same 4-level structure)
└─ ... (all composite tokens)
```

**Registry 4: Contract Registry** (Enhanced for composites)
```
Merkle Tree Structure:
├─ Root (Hash of all contracts)
├─ Branch: Active Contracts (not yet bound)
│  └─ Leaf: Contract-001 (PENDING)
└─ Branch: Bound Contracts (linked to composites)
   ├─ Leaf: Contract-002 (BOUND to Composite-001)
   ├─ Leaf: Contract-003 (BOUND to Composite-002)
   └─ ... (all bound contracts)
```

#### 5.1.4 Cryptographic Proof Chain

**Digital Twin Hash Computation** (Deterministic):
```
digitalTwinHash = SHA-256(
    HASH(primaryToken) ||
    HASH(sortedSecondaryTokens[]) ||
    HASH(assetMetadata) ||
    TIMESTAMP
)
```

**Composite Merkle Root**:
```
compositeRoot = SHA-256(
    SHA-256(primaryTokenHash, secondaryTokensMerkleRoot) ||
    TIMESTAMP ||
    oraclePublicKey
)
```

**Oracle Signature** (CRYSTALS-Dilithium - NIST Level 5):
```
oracleSignature = SIGN(
    compositeTokenId +
    digitalTwinHash +
    compositeRoot +
    verificationTimestamp,
    oracleQuantumPrivateKey
)
```

**Binding Proof** (Links Composite to Contract):
```
bindingProof = {
    compositeTokenId,
    activeContractId,
    bindingTimestamp,
    merkleProofs: {
        assetMerkleProof,
        tokenMerkleProof,
        compositeMerkleProof,
        contractMerkleProof
    },
    bindingSignature: SIGN(
        compositeTokenId + activeContractId + bindingTimestamp,
        compositeVerifierQuantumKey
    )
}
```

**External Verification** (Decentralized, No Central Authority):
```
verifyComposite(compositeTokenId, proofs):
  1. Replay assetMerkleProof against assetMerkleRoot
  2. Replay tokenMerkleProof against tokenMerkleRoot
  3. Replay compositeMerkleProof against compositeMerkleRoot
  4. Recompute digitalTwinHash from primary + secondary tokens
  5. Verify oracle signature with oracle's public key
  6. If bound: Verify binding proof against contract registry
  7. Return: {verified: true/false, inconsistencies: []}
```

#### 5.1.5 Trusted Oracle Integration

**Oracle Role**:
- Independent 3rd party (certified auditor, notary, government entity)
- Verifies secondary token authenticity
- Signs composite token verification with quantum key
- Maintains immutable audit trail

**Oracle Verification Workflow**:
```
1. Oracle receives verification request for composite
   ↓
2. Oracle reviews:
   - Primary token (asset owner, KYC status)
   - Secondary tokens (documents, photos, videos)
   - Document hashes (SHA-256 verification)
   ↓
3. Oracle validates:
   - All documents authentic
   - Signatures and certifications valid
   - Digital twin accurately represents asset
   ↓
4. Oracle signs with CRYSTALS-Dilithium key:
   - Signs: compositeTokenId + digitalTwinHash + timestamp
   ↓
5. Oracle publishes verification immutably:
   - Signature stored in database
   - Event published: CompositeTokenVerifiedEvent
   - Status: VERIFIED
   ↓
6. System updates composite:
   - Status → VERIFIED
   - Oracle signature + verification timestamp stored
   - Ready for contract binding
```

**Trusted Oracle Registry**:
```sql
CREATE TABLE trusted_oracles (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    certifications TEXT[] NOT NULL,
    public_key BYTEA NOT NULL, -- CRYSTALS-Dilithium public key
    verified_count INT DEFAULT 0,
    last_verification TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.1.6 Data Persistence Strategy

**Primary Storage**:
- **PostgreSQL 16**: All entities (Assets, Tokens, Composites, Contracts)
- **LevelDB** (embedded): Merkle tree nodes and proofs
- **S3/Cloud Storage**: Encrypted document storage (immutable, AES-256)

**Merkle Tree Caching**:
- **Redis**: Cache merkle proofs (24-hour TTL)
- **Hazelcast**: Distributed cache for multi-node consistency

**Audit Trail**:
- **Immutable Tables**: oracle_verifications, composite_token_bindings
- **Event Log**: All state transitions logged with timestamp + actor

### 5.2 REST API Endpoints (Composite Token)

**25+ New Endpoints across 6 endpoint groups**:

```
PRIMARY TOKEN ENDPOINTS:
POST   /api/v11/rwa/tokens/primary/create
GET    /api/v11/rwa/tokens/primary/{tokenId}
GET    /api/v11/rwa/tokens/primary/asset/{assetId}
POST   /api/v11/rwa/tokens/primary/{tokenId}/verify
PUT    /api/v11/rwa/tokens/primary/{tokenId}/status

SECONDARY TOKEN ENDPOINTS:
POST   /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary/upload
GET    /api/v11/rwa/tokens/secondary/{secondaryTokenId}
GET    /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary
POST   /api/v11/rwa/tokens/secondary/{secondaryTokenId}/verify
DELETE /api/v11/rwa/tokens/secondary/{secondaryTokenId}

COMPOSITE TOKEN ENDPOINTS:
POST   /api/v11/rwa/tokens/composite/create
GET    /api/v11/rwa/tokens/composite/{compositeTokenId}
POST   /api/v11/rwa/tokens/composite/{compositeTokenId}/verify
GET    /api/v11/rwa/tokens/composite/{compositeTokenId}/merkle-proofs
GET    /api/v11/rwa/tokens/primary/{primaryTokenId}/composite

COMPOSITE-CONTRACT BINDING ENDPOINTS:
POST   /api/v11/rwa/composite-tokens/{compositeTokenId}/bind-to-contract
GET    /api/v11/rwa/composite-tokens/{compositeTokenId}/bound-contract
GET    /api/v11/rwa/contracts/{contractId}/composite-token
GET    /api/v11/rwa/composite-tokens/{compositeTokenId}/binding-proof
GET    /api/v11/rwa/registry/composite-token-contracts

MERKLE REGISTRY ENDPOINTS:
GET    /api/v11/rwa/registry/composite-tokens
GET    /api/v11/rwa/registry/composite-tokens/{tokenId}/proof
POST   /api/v11/rwa/registry/verify-composite-token
GET    /api/v11/rwa/registry/consistency-report

ORACLE MANAGEMENT ENDPOINTS:
GET    /api/v11/rwa/oracles
POST   /api/v11/rwa/oracles/register
GET    /api/v11/rwa/oracles/{oracleId}/verifications
POST   /api/v11/rwa/webhooks/oracle-verification
```

---

## Future Roadmap

### Short-Term (November - December 2025 - Sprints 13-15)

**Sprint 13 (Nov 4-14)** - Enterprise Portal V4.6.0
- 🚧 8 new React components (network topology, validators, RWA, etc.)
- 🚧 8 corresponding API endpoints (+800% coverage improvement)
- 🚧 WebSocket implementation (real-time updates)
- 📋 Validator management UI (staking interface)

**Sprint 14-15 (Nov 17-Dec 5)** - Critical Gap Closure
- 📋 E2E testing framework (Cypress configuration)
- 📋 Multi-cloud deployment (Azure, GCP setup)
- 📋 Oracle integration completion (5 oracles)
- 📋 Performance validation (3M TPS sustainability tests)
- 📋 Documentation consolidation (retire HMS PRD v2.0)

### Medium-Term (Q1-Q2 2026 - Sprints 16+)
- 📋 Complete gRPC service layer (Sprint 7-8)
- 📋 AI-driven insights integration (Sprint 9-10)
- 📋 Carbon offset integration (Gold Standard, Verra)
- 📋 Green Blockchain Certification (Q1 2026)
- 📋 Cross-chain bridge expansion (10+ networks)
- 📋 Smart contract IDE and debugger
- 📋 APM and error tracking (Sentry integration)
- 📋 Advanced RWA marketplace features
- 📋 Mobile wallet application (React Native)

### Long-Term (Q3-Q4 2026+)
- 📋 Sharding implementation (horizontal scaling)
- 📋 Layer 2 scaling solutions
- 📋 Zero-knowledge rollups
- 📋 2M+ TPS sustained production performance
- 📋 Decentralized governance model
- 📋 Full V10 deprecation (18 months post V11 GA)
- 📋 Carbon-negative status (2027)
- 📋 100% renewable energy target (2028)

---

## Guardrails & Operational Constraints

### Performance Guardrails

**TPS Thresholds**:
- **Critical Alert**: < 500K TPS (immediate investigation required)
- **Warning**: < 750K TPS (optimization needed)
- **Healthy**: ≥ 776K TPS (current baseline)
- **Target**: ≥ 2M TPS (production goal)

**Latency Guardrails**:
- **Critical**: p99 > 200ms (service degradation)
- **Warning**: p99 > 100ms (optimization needed)
- **Healthy**: p50 < 50ms, p95 < 100ms, p99 < 150ms
- **Target**: p50 < 10ms, p95 < 25ms, p99 < 50ms

**Resource Utilization**:
- **CPU**: < 80% sustained (auto-scale trigger at 70%)
- **Memory**: < 80% of allocated (JVM/native)
- **Disk I/O**: < 70% capacity (queue monitoring)
- **Network**: < 75% bandwidth (congestion prevention)

### Security Guardrails

**Cryptographic Standards**:
- **Mandatory**: NIST Level 5 quantum-resistant cryptography
- **Prohibited**: SHA-1, MD5, DES, RSA < 4096 bits
- **Required**: CRYSTALS-Dilithium (signatures), CRYSTALS-Kyber (encryption)
- **Key Rotation**: Every 90 days for production keys

**API Security**:
- **Rate Limiting**: 1000 req/min per IP (adjustable)
- **Authentication**: OAuth 2.0 + JWT mandatory
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS 1.3 minimum, no downgrade allowed

**Access Control**:
- **Admin Actions**: Require 2FA + audit log
- **Sensitive Operations**: Multi-signature approval
- **Key Storage**: Hardware security modules (HSM) only
- **Backup Encryption**: AES-256-GCM mandatory

### Consensus Guardrails

**HyperRAFT++ Constraints**:
- **Minimum Nodes**: 3 (dev), 5 (staging), 7+ (production)
- **Quorum**: Simple majority (n/2 + 1)
- **Leader Election Timeout**: 150-300ms
- **Heartbeat Interval**: 50ms
- **Log Replication**: Parallel with batching

**Byzantine Fault Tolerance**:
- **Max Faulty Nodes**: f < n/3 (where n = total nodes)
- **Network Partition**: Minority partition halts (safety over liveness)
- **Recovery**: Automatic within 5 seconds
- **Consistency**: Strong consistency, no eventual consistency mode

### Data Integrity Guardrails

**Transaction Validation**:
- **Signature Verification**: 100% mandatory (no exceptions)
- **Nonce Validation**: Strict sequential enforcement
- **Balance Checks**: Pre-transaction validation required
- **Gas Limits**: Enforced with abort on exceed
- **Smart Contract**: Gas metering + execution timeout (30s max)

**Block Validation**:
- **Merkle Root**: Must match all transactions
- **Previous Hash**: Must reference valid parent block
- **Timestamp**: Within 10-second drift tolerance
- **Size Limit**: 10MB maximum (configurable)
- **Transaction Count**: 10K max per block (current)

**State Management**:
- **Checkpoints**: Every 1000 blocks
- **Backup**: Hourly incremental, daily full
- **Retention**: 90 days minimum, 365 days recommended
- **Verification**: Merkle tree proofs for all state transitions

### Availability Guardrails

**Uptime Requirements**:
- **Development**: 95% SLA
- **Staging**: 99% SLA
- **Production**: 99.99% SLA (52 minutes downtime/year max)

**Failover**:
- **Detection**: < 10 seconds (health check interval: 5s)
- **Promotion**: < 30 seconds (leader election)
- **Recovery**: < 2 minutes (full service restoration)
- **Replication**: 3x minimum (different availability zones)

**Disaster Recovery**:
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 15 minutes
- **Backup Locations**: 3 geographically distributed
- **Restoration Testing**: Monthly

### Scalability Guardrails

**Horizontal Scaling**:
- **Auto-Scale Trigger**: 70% CPU or memory for 5 minutes
- **Scale-Up**: Add 2 nodes minimum per event
- **Scale-Down**: Remove 1 node max per event (safety)
- **Cool-Down Period**: 10 minutes between scaling events
- **Maximum Nodes**: 1000 per cluster

**Vertical Scaling**:
- **CPU**: 2-32 cores (production), 1-8 cores (dev)
- **Memory**: 4GB-64GB (production), 2GB-16GB (dev)
- **Storage**: 100GB-10TB (auto-expand)
- **Network**: 1Gbps-100Gbps

### API Guardrails

**Request Limits**:
- **Anonymous**: 100 req/min
- **Authenticated**: 1000 req/min
- **Premium**: 10,000 req/min
- **Burst**: 2x sustained rate for 10 seconds

**Response Time SLA**:
- **Read Operations**: < 100ms (p95)
- **Write Operations**: < 500ms (p95)
- **Batch Operations**: < 5s (p95)
- **Complex Queries**: < 2s (p95)

**Payload Limits**:
- **Request Body**: 10MB maximum
- **Response Body**: 50MB maximum
- **WebSocket Frame**: 1MB maximum
- **File Upload**: 100MB maximum

### Migration Guardrails

**V10 → V11 Migration Rules**:
- **Parallel Operation**: Both must run until 100% V11 validation
- **Traffic Split**: Gradual 10% → 25% → 50% → 75% → 100%
- **Rollback**: Automated if error rate > 1% for 5 minutes
- **Data Consistency**: Zero data loss tolerance
- **Backward Compatibility**: Maintain V10 API for 6 months post-migration

**Feature Parity**:
- **Consensus**: V11 must match V10 finality guarantees
- **Cryptography**: V11 must exceed V10 security level
- **Performance**: V11 must achieve ≥ V10 TPS before cutover
- **APIs**: All V10 endpoints must have V11 equivalents

### Monitoring & Alerting Guardrails

**Metrics Collection**:
- **Frequency**: Every 10 seconds (critical metrics)
- **Retention**: 30 days high-resolution, 1 year aggregated
- **Dashboards**: Real-time updates (5-second refresh)
- **Anomaly Detection**: ML-based with 95% accuracy target

**Alert Levels**:
- **P0 (Critical)**: Immediate page-out, < 5 minute response
- **P1 (High)**: Notify on-call, < 15 minute response
- **P2 (Medium)**: Email/Slack, < 1 hour response
- **P3 (Low)**: Ticket creation, next business day

**Alert Fatigue Prevention**:
- **Max Alerts**: 10 per hour per service
- **Grouping**: Similar alerts consolidated
- **Auto-Resolution**: 5 minutes of healthy state
- **Escalation**: P2 → P1 if unresolved for 1 hour

### Testing Guardrails

**Code Coverage**:
- **Unit Tests**: ≥ 80% line coverage mandatory
- **Integration Tests**: ≥ 70% critical path coverage
- **E2E Tests**: 100% user flow coverage
- **Performance Tests**: Every release with TPS validation

**Test Environments**:
- **Development**: No guardrails (experimental)
- **Staging**: Production-like constraints (90% of prod)
- **Pre-Production**: Identical to production
- **Production**: Full guardrails enforced

**Load Testing**:
- **Frequency**: Before every major release
- **Duration**: Minimum 24-hour sustained load
- **Target**: 150% of expected production load
- **Pass Criteria**: < 0.1% error rate, no memory leaks

### Compliance Guardrails

**Regulatory Requirements**:
- **Data Privacy**: GDPR, CCPA compliant
- **Financial**: AML/KYC integration required for RWA
- **Audit Logging**: Immutable, tamper-proof, 7-year retention
- **Right to be Forgotten**: Pseudonymization support

**Security Audits**:
- **Frequency**: Quarterly (external), monthly (internal)
- **Scope**: Full codebase, infrastructure, dependencies
- **Vulnerabilities**: P0/P1 must be fixed within 48 hours
- **Penetration Testing**: Bi-annually by certified firm

### Operational Guardrails

**Change Management**:
- **Code Review**: 2 approvals minimum (senior engineer + architect)
- **Deployment**: Blue-green with smoke tests
- **Rollback**: Single command, < 5 minutes
- **Communication**: 24-hour notice for breaking changes

**Incident Response**:
- **Detection**: Automated monitoring (< 1 minute)
- **Triage**: On-call engineer (< 5 minutes)
- **Resolution**: Based on priority (P0: < 1 hour)
- **Post-Mortem**: Within 48 hours, action items tracked

**Documentation**:
- **API Docs**: Auto-generated from code (OpenAPI/gRPC)
- **Architecture Docs**: Updated with every major change
- **Runbooks**: For all common operations
- **Knowledge Base**: Updated within 24 hours of resolution

### Cost Guardrails

**Resource Budgets**:
- **Compute**: $5K/month (dev), $50K/month (prod)
- **Storage**: $1K/month (dev), $10K/month (prod)
- **Network**: $500/month (dev), $5K/month (prod)
- **Total**: $20K/month (dev), $200K/month (prod)

**Cost Optimization**:
- **Auto-shutdown**: Dev environments after 6 PM
- **Reserved Instances**: 70% of baseline capacity
- **Spot Instances**: Allowed for non-critical workloads
- **Review**: Monthly cost analysis and optimization

### Deprecation Policy

**V10 Deprecation Timeline**:
1. **Announcement**: 6 months before V11 GA
2. **Parallel Operation**: 6 months post-V11 GA
3. **Deprecation Notice**: All APIs marked deprecated
4. **Support End**: 12 months post-V11 GA
5. **Decommission**: 18 months post-V11 GA

**Feature Deprecation**:
- **Notice**: 3 months minimum
- **Migration Guide**: Provided with alternatives
- **Support Period**: 6 months post-deprecation
- **Breaking Changes**: Major version bump only

---

## Appendix

### Technology Decisions

**Why Java 21 for V11?**
- Virtual threads for massive concurrency
- Strong typing and tooling
- GraalVM native compilation
- Enterprise-grade ecosystem
- Superior performance for high-TPS workloads

**Why Quarkus?**
- Kubernetes-native framework
- Sub-second startup time
- Low memory footprint
- Reactive programming support
- Excellent GraalVM integration

**Why HyperRAFT++?**
- Proven consensus algorithm (RAFT)
- Enhanced with parallel log replication
- AI-driven optimization
- Deterministic finality
- Byzantine fault tolerance

### Performance Benchmarks

**V11 Native vs JVM Mode**:
| Metric | Native | JVM |
|--------|--------|-----|
| Startup | 0.8s | 3.2s |
| Memory | 245MB | 512MB |
| Throughput | 776K TPS | 650K TPS |
| Latency (p99) | 45ms | 78ms |

### Related Documentation
- `/CLAUDE.md` - Project configuration
- `/PROJECT_PLAN.md` - Development plan
- `/AURIGRAPH-TEAM-AGENTS.md` - Agent framework
- `/SOPs/` - Standard operating procedures

---

---

## Key Updates (November 3, 2025)

### Performance Clarification
- **Current Baseline**: 776K TPS (production-verified)
- **ML Optimization Peak**: 3.0M TPS (Sprint 5 benchmarks, not sustained)
- **Whitepaper Target**: 2M+ TPS (roadmap goal)
- **Performance Roadmap**: Needed to close 1.224M TPS gap

### Migration Progress
- **Phase 1**: 100% complete (core structure, REST API, JWT auth)
- **Phase 2**: 50% complete (50% of core services implemented)
- **Phase 3**: 0% complete (full production optimization pending)

### Critical Gaps Identified
1. **API Endpoint Coverage**: 19.6% (9/46 endpoints) → Sprint 13 targets +8
2. **WebSocket Support**: In progress (console errors being fixed)
3. **E2E Testing**: 0% (Cypress not configured) → Sprint 14-15
4. **Multi-Cloud**: 10% (AWS only) → Sprint 14-15
5. **Documentation**: Multiple outdated versions → Consolidation needed

### Enterprise Portal Status
- **Version**: v4.5.0 (production live at https://dlt.aurigraph.io)
- **Test Coverage**: 85%+ (Portal PRD score: 87/100)
- **Feature Completion**: 70% of documented features
- **Demo Management**: 95% complete (exceptional feature)

### Recent Achievements (Oct-Nov 2025)
- ✅ JWT-based authentication (commit 0be32e7a)
- ✅ Database migration cleanup (Flyway)
- ✅ WebSocket error fixes (in progress)
- ✅ AI/ML optimization (3.0M TPS benchmarks)
- ✅ Enterprise Portal v4.5.0 deployment

---

**Document Version**: 1.1.0
**Last Updated**: 2025-11-03
**Status**: Living Document (Updated Continuously)
**Maintainer**: Aurigraph DLT Core Team

**Next Review**: After Sprint 13 completion (November 14, 2025)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
