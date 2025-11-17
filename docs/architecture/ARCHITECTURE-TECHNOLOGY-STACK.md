# Aurigraph DLT Technology Stack Architecture

**Version**: 11.1.0 | **Section**: Technology Stack | **Status**: 🟢 Production Ready
**Last Updated**: 2025-11-17 | **Related**: [ARCHITECTURE-MAIN.md](./ARCHITECTURE-MAIN.md)

---

## V10 Architecture (TypeScript - Legacy)

### Overview
V10 is the current production system built on Node.js/TypeScript, delivering 1M+ TPS with proven stability.

### Core Technology Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Framework**: Custom blockchain framework
- **Build**: npm + tsc

### Key Components
- **Consensus**: HyperRAFT++ (TypeScript implementation)
- **Crypto**: CRYSTALS-Dilithium/Kyber (BouncyCastle)
- **Networking**: Custom P2P with encrypted channels
- **State**: In-memory with periodic persistence

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

### Core Technology Stack

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

### Native Compilation Profiles

1. **`-Pnative-fast`** (Development): 2 minutes, -O1
2. **`-Pnative`** (Standard): 15 minutes, -O2
3. **`-Pnative-ultra`** (Ultra-Optimized): 30 minutes, -O3 + -march=native

### Performance Metrics (V11 Current - November 2025)
- **TPS Baseline**: 776K TPS (production baseline)
- **TPS with ML**: 3.0M TPS (Sprint 5 benchmarks)
- **TPS Target**: 2M+ (roadmap goal)
- **Startup**: <1s (native), ~3s (JVM)
- **Memory**: <256MB (native), ~512MB (JVM)
- **Finality**: <500ms current, <100ms target
- **Carbon Footprint**: <0.17 gCO₂/tx (target)

---

## Multi-Cloud Deployment Architecture

### Node Type Specialization

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

### Multi-Cloud Topology

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

---

## Carbon Footprint Tracking Architecture

### Purpose
Track and report carbon emissions for every transaction

### Architecture Components

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

### Carbon Calculation Model
```java
public class CarbonFootprintService {
    public double calculateTransactionCarbon(Transaction tx, ProcessingMetrics metrics) {
        // Energy components
        double cpuEnergy = (metrics.cpuSeconds * TDP_WATTS) / 3600 / 1000;
        double networkEnergy = (tx.sizeBytes * validators * ENERGY_PER_BYTE) / 1000;
        double storageEnergy = (tx.sizeBytes * ENERGY_PER_BYTE_YEAR * 10) / 1000;
        double consensusEnergy = (consensusRounds * validators * ROUND_ENERGY) / 1000;

        double totalEnergy = cpuEnergy + networkEnergy + storageEnergy + consensusEnergy;
        CarbonIntensity intensity = gridCarbonService.getCurrentIntensity(metrics.region);
        return totalEnergy * intensity.gCO2PerKWh;
    }
}
```

---

## Technology Comparison Table

| Aspect | V10 (TypeScript) | V11 (Java/Quarkus) | Winner |
|--------|-----------------|-------------------|--------|
| **Startup Time** | ~3s | <1s | V11 ✅ |
| **Memory Usage** | 512MB-2GB | <256MB | V11 ✅ |
| **TPS Baseline** | 1M+ | 776K | V10 |
| **TPS Target** | - | 2M+ | V11 ✅ |
| **Concurrency** | Event loops | Virtual Threads | V11 ✅ |
| **Native Compilation** | No | Yes (GraalVM) | V11 ✅ |
| **Type Safety** | Partial | Full | V11 ✅ |
| **Production Proven** | Yes | In progress | V10 |

---

## Storage Architecture

### Primary Storage
- **PostgreSQL 16**: All entities (Assets, Tokens, Composites, Contracts)
- **LevelDB** (embedded): Merkle tree nodes and proofs
- **S3/Cloud Storage**: Encrypted document storage (immutable, AES-256)

### Caching Strategy
- **Redis**: Cache merkle proofs (24-hour TTL)
- **Hazelcast**: Distributed cache for multi-node consistency

### Audit Trail
- **Immutable Tables**: oracle_verifications, composite_token_bindings
- **Event Log**: All state transitions logged with timestamp + actor

---

## Migration Path

```
Phase 1 (Complete)    Phase 2 (In Progress)    Phase 3 (Planned)
┌─────────────────┐   ┌─────────────────┐     ┌─────────────────┐
│ Core Structure  │──>│ Service Layer   │────>│ Full Migration  │
│ - REST API      │   │ - Consensus     │     │ - gRPC Complete │
│ - Basic Tx      │   │ - Crypto        │     │ - Native Opt    │
│ - Health        │   │ - AI/ML ✓       │     │ - 2M+ TPS       │
│ - JWT Auth ✓    │   │ - Portal ✓      │     │ - Multi-Cloud   │
└─────────────────┘   └─────────────────┘     └─────────────────┘
   100% Complete         50% Complete            0% Complete
```

---

**Navigation**: [Main](./ARCHITECTURE-MAIN.md) | [Technology Stack](./ARCHITECTURE-TECHNOLOGY-STACK.md) ← | [Components](./ARCHITECTURE-V11-COMPONENTS.md) | [APIs](./ARCHITECTURE-API-ENDPOINTS.md) | [Consensus](./ARCHITECTURE-CONSENSUS.md) | [Security](./ARCHITECTURE-CRYPTOGRAPHY.md)

🤖 Phase 2 Documentation Chunking - Technology Stack Document
