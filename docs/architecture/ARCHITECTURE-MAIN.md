# Aurigraph DLT Platform Architecture - Main Overview

**Version**: 11.1.0 (V11 Migration Progress)
**Status**: 🚧 Hybrid V10/V11 Architecture (42% migrated)
**Last Updated**: 2025-11-17
**Document Type**: Architecture Index & Overview

---

## Quick Navigation

This document provides an overview of the complete Aurigraph architecture. For detailed information on specific topics, see the related documents:

### Core Architecture Documents

1. **[ARCHITECTURE-MAIN.md](./ARCHITECTURE-MAIN.md)** ← You are here
   - Executive summary and system overview
   - High-level architecture diagram
   - Quick reference guide

2. **[ARCHITECTURE-TECHNOLOGY-STACK.md](./ARCHITECTURE-TECHNOLOGY-STACK.md)**
   - V10 technology stack (TypeScript/Node.js)
   - V11 technology stack (Java/Quarkus/GraalVM)
   - Multi-cloud deployment architecture
   - Carbon footprint tracking system

3. **[ARCHITECTURE-V11-COMPONENTS.md](./ARCHITECTURE-V11-COMPONENTS.md)**
   - Core services and modules
   - Enterprise Portal frontend architecture
   - IAM service (Keycloak) integration
   - Component interaction patterns

4. **[ARCHITECTURE-API-ENDPOINTS.md](./ARCHITECTURE-API-ENDPOINTS.md)**
   - V11 REST API endpoints (46+ endpoints)
   - gRPC service definitions (planned)
   - Composite token REST API (25+ endpoints)
   - API request/response patterns

5. **[ARCHITECTURE-CONSENSUS.md](./ARCHITECTURE-CONSENSUS.md)**
   - HyperRAFT++ consensus algorithm
   - Transaction processing flow
   - Consensus flow (7-step diagram)
   - Byzantine fault tolerance
   - AI-driven optimization

6. **[ARCHITECTURE-CRYPTOGRAPHY.md](./ARCHITECTURE-CRYPTOGRAPHY.md)**
   - Multi-layer security model (6 layers)
   - Quantum-resistant cryptography (CRYSTALS)
   - NIST Level 5 security standards
   - Key management and rotation
   - Zero-knowledge proofs

---

## Executive Summary

Aurigraph DLT is a high-performance blockchain platform transitioning from TypeScript (V10) to Java/Quarkus/GraalVM (V11) architecture to achieve:

- **Target Performance**: 2M+ TPS (currently 776K TPS in V11)
- **Consensus**: HyperRAFT++ with AI optimization
- **Security**: NIST Level 5 quantum-resistant cryptography
- **Interoperability**: Cross-chain bridge with major networks
- **Innovation**: AI-driven consensus optimization and real-world asset tokenization

### Current State (November 17, 2025)
- **V10 (TypeScript)**: Production-ready, 1M+ TPS capability (legacy support)
- **V11 (Java/Quarkus)**: 42% migrated, 776K TPS baseline achieved
- **V11 ML Optimization**: 3.0M TPS achieved in Sprint 5 benchmarks
- **Enterprise Portal**: v4.5.0 live at https://dlt.aurigraph.io
- **Both versions** coexist during migration period

---

## System Architecture Overview

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

## Key Architectural Principles

### 1. **Hybrid V10/V11 Architecture**
Both versions run in parallel during migration for:
- Zero-downtime upgrades
- Feature flag-based traffic routing
- Gradual cutover (10% → 25% → 50% → 75% → 100%)
- Automatic rollback if error rate > 1%

### 2. **Performance-First Design**
- **Virtual Threads** (Java 21): Massive concurrency
- **Reactive Programming** (Mutiny): Non-blocking I/O
- **GraalVM Native**: <1s startup, <256MB memory
- **Parallel Consensus**: HyperRAFT++ with AI optimization

### 3. **Security as Foundation**
- **NIST Level 5**: Quantum-resistant cryptography
- **6-Layer Security**: Application → API → Transport → Crypto → Consensus → Network
- **Zero-Trust**: Every request authenticated and authorized
- **Immutable Audit Trail**: All actions logged tamper-proof

### 4. **Cloud-Native Infrastructure**
- **Kubernetes-Ready**: Docker containers with health checks
- **Multi-Cloud**: AWS, Azure, GCP with VPN mesh
- **Auto-Scaling**: HPA/VPA for demand-driven scaling
- **Distributed**: Consensus across regions with <50ms latency

### 5. **Real-World Asset Integration**
- **Composite Tokens**: Digital twins of physical assets
- **Merkle Registries**: Immutable proof of asset ownership
- **Oracle Integration**: 3rd-party verification with quantum signatures
- **Compliance Tracking**: ESG reporting, carbon footprints

---

## Migration Status (November 2025)

### Phase 1: Foundation ✅ (100% Complete)
- ✅ Quarkus project structure
- ✅ REST API endpoints
- ✅ Basic transaction service
- ✅ Health check endpoints
- ✅ Native compilation setup
- ✅ JWT authentication

### Phase 2: Core Services 🚧 (50% Complete)
- ✅ HyperRAFT++ consensus (70% - AI optimization pending)
- ✅ AI optimization services (90% - online learning pending)
- ✅ RWAT registry with Merkle tree (80% - oracle integration partial)
- ✅ Native build optimization
- ✅ Enterprise Portal v4.5.0 (complete)
- 🚧 gRPC service layer (Sprint 7 target)
- 🚧 WebSocket support (in progress)
- 🚧 Cross-chain bridge (partial)

### Phase 3: Full Production 📋 (0% Complete)
- 📋 Complete gRPC implementation (Sprint 7-8)
- 📋 2M+ TPS achievement
- 📋 Multi-cloud deployment (Azure, GCP)
- 📋 Full test suite (95% coverage)
- 📋 Carbon offset integration (Sprint 16-18)
- 📋 V10 deprecation timeline

---

## Technology Stack Comparison

| Aspect | V10 (TypeScript) | V11 (Java/Quarkus) |
|--------|-----------------|-------------------|
| **Runtime** | Node.js 20+ | Java 21 + Virtual Threads |
| **Framework** | Custom | Quarkus 3.26.2 |
| **Compilation** | JIT (tsc) | GraalVM Native |
| **Startup** | ~3s | <1s |
| **Memory** | 512MB-2GB | <256MB |
| **TPS** | 1M+ | 776K baseline, 2M+ target |
| **Build Time** | Seconds | 2-30 min (native profiles) |

---

## Deployment Status

### Production Environment (dlt.aurigraph.io)
**Status**: 🟢 PRODUCTION READY

**Infrastructure**: 7/7 Containers Healthy ✅
- dlt-nginx-gateway (Reverse proxy & SSL/TLS)
- dlt-postgres (Database)
- dlt-redis (Cache)
- dlt-prometheus (Metrics)
- dlt-grafana (Dashboards)
- dlt-portal (Frontend)
- dlt-aurigraph-v11 (API placeholder)

**Endpoints**: All Operational ✅
- https://dlt.aurigraph.io → 200 OK (Portal)
- https://dlt.aurigraph.io/q/health → 200 OK (Health)
- https://dlt.aurigraph.io/grafana → 301 Redirect (Dashboards)

**Security**: Fully Hardened ✅
- CSP header comprehensive and tested
- All security headers configured
- SSL/TLS 1.2 & 1.3 enabled
- Rate limiting active
- Zero CSP violations

---

## Performance Targets

| Metric | V10 Current | V11 Current | V11 Target |
|--------|-------------|-------------|-----------|
| **TPS** | 1M+ | 776K | 2M+ |
| **Finality** | <500ms | <200ms | <100ms |
| **Startup** | ~3s | <1s | <0.5s |
| **Memory** | 512MB-2GB | <256MB | <128MB |
| **Latency (p95)** | <100ms | <50ms | <10ms |

---

## Quick Reference: Document Map

```
docs/architecture/
├── ARCHITECTURE-MAIN.md                    [This file]
│   └─ Overview, quick navigation, high-level summary
├── ARCHITECTURE-TECHNOLOGY-STACK.md        [📄 Technology stacks]
│   ├─ V10 TypeScript architecture
│   ├─ V11 Java/Quarkus architecture
│   ├─ Native compilation profiles
│   ├─ Multi-cloud deployment
│   └─ Carbon footprint tracking
├── ARCHITECTURE-V11-COMPONENTS.md          [📄 Components & services]
│   ├─ Core services & modules
│   ├─ Enterprise Portal architecture
│   ├─ IAM service (Keycloak)
│   └─ Component interaction
├── ARCHITECTURE-API-ENDPOINTS.md           [📄 APIs]
│   ├─ V11 REST API (46+ endpoints)
│   ├─ gRPC services (planned)
│   ├─ Composite token API (25+ endpoints)
│   └─ API patterns & conventions
├── ARCHITECTURE-CONSENSUS.md               [📄 Consensus]
│   ├─ HyperRAFT++ algorithm
│   ├─ Transaction flow (8 steps)
│   ├─ Consensus flow (7 steps)
│   ├─ Byzantine fault tolerance
│   └─ AI optimization
└── ARCHITECTURE-CRYPTOGRAPHY.md            [📄 Security]
    ├─ Multi-layer security model
    ├─ CRYSTALS-Dilithium (signatures)
    ├─ CRYSTALS-Kyber (encryption)
    ├─ NIST Level 5 standards
    └─ Key management
```

---

## Getting Started

### For Developers
1. Start with **ARCHITECTURE-MAIN.md** (this file) for overview
2. Read **ARCHITECTURE-V11-COMPONENTS.md** for service details
3. Reference **ARCHITECTURE-API-ENDPOINTS.md** for API contracts
4. Study **ARCHITECTURE-CONSENSUS.md** for transaction flow

### For DevOps/Operations
1. Review **ARCHITECTURE-MAIN.md** for system overview
2. Check **ARCHITECTURE-TECHNOLOGY-STACK.md** for deployment details
3. Reference **ARCHITECTURE-CRYPTOGRAPHY.md** for security policies
4. Monitor health endpoints at https://dlt.aurigraph.io/q/health

### For Security/Compliance
1. Read **ARCHITECTURE-CRYPTOGRAPHY.md** first
2. Review **ARCHITECTURE-CONSENSUS.md** for Byzantine tolerance
3. Check deployment section in **ARCHITECTURE-TECHNOLOGY-STACK.md**
4. Audit trail and monitoring details in main guides

### For Product/Leadership
1. Executive summary section (above)
2. Migration status section for project tracking
3. Performance targets comparison table
4. **ARCHITECTURE-TECHNOLOGY-STACK.md** for multi-cloud strategy

---

## Related Documentation

- `/CLAUDE.md` - Development guide and quick commands
- `/DEVELOPMENT.md` - Setup and development procedures
- `/LARGE_FILES_CHUNKING_STRATEGY.md` - File organization plan
- `/JIRA_COMPREHENSIVE_UPDATE_NOV17_2025.md` - Project status
- `/docs/PHASE1_COMPLETION_REPORT.md` - Phase 1 completion details
- `/docs/archive/jira-tickets/INDEX.md` - Historical JIRA data

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-11-17 | Split into 6 focused documents (Phase 2 chunking) |
| 1.0.0 | 2025-11-03 | Original monolithic ARCHITECTURE.md |

---

**Document Type**: Architecture Overview & Index
**Audience**: All technical and non-technical stakeholders
**Update Frequency**: Monthly or after major architectural changes
**Maintainer**: Aurigraph DLT Core Team
**Next Review**: After Sprint 13 completion (November 21, 2025)

---

**Navigation**: [Home](../README.md) | [Technology Stack](./ARCHITECTURE-TECHNOLOGY-STACK.md) | [Components](./ARCHITECTURE-V11-COMPONENTS.md) | [APIs](./ARCHITECTURE-API-ENDPOINTS.md) | [Consensus](./ARCHITECTURE-CONSENSUS.md) | [Security](./ARCHITECTURE-CRYPTOGRAPHY.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code) - Phase 2 Documentation Chunking
Co-Authored-By: Claude <noreply@anthropic.com>
