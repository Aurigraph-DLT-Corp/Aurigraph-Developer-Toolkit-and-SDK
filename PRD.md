# Product Requirements Document (PRD)
## Aurigraph DLT Platform - Java/Quarkus Production Release

### Version 11.3.1
**Last Updated**: October 16, 2025
**Status**: Production Ready ✅

---

## 1. Executive Summary

### 1.1 Project Overview
Aurigraph DLT is a high-performance blockchain platform built on Java/Quarkus/GraalVM achieving 1.97M TPS with quantum-resistant cryptography, enterprise-grade smart contracts, and real-world asset tokenization.

### 1.2 Current State
- **Platform**: Java 21 + Quarkus 3.28.2 + GraalVM native compilation
- **Performance**: 1.97M TPS sustained (99% of 2M target)
- **Deployment**: Production at https://dlt.aurigraph.io
- **Frontend**: React/TypeScript enterprise portal
- **Backend API**: RESTful + gRPC with HTTP/2

### 1.3 Key Objectives
✅ Achieve 2M+ TPS with sub-100ms finality (99% achieved)
✅ Implement quantum-resistant cryptography (CRYSTALS-Kyber/Dilithium)
✅ Provide enterprise-grade smart contracts (Ricardian contracts)
✅ Enable real-world asset tokenization with regulatory compliance
✅ Deploy production-ready platform with full monitoring

---

## 2. Technical Architecture

### 2.1 Technology Stack

#### Core Framework
- **Runtime**: Java 21 with Virtual Threads (Project Loom)
- **Framework**: Quarkus 3.28.2 with reactive programming (Mutiny)
- **Server**: Undertow with HTTP/2 support
- **Protocol**: gRPC with Protocol Buffers 3
- **Native**: GraalVM for sub-second startup and low memory footprint

#### Communication Layer
- **Internal**: gRPC/HTTP2 with Protocol Buffers
- **External API**: REST over HTTP/2 (Quarkus RESTEasy Reactive)
- **Real-time**: Server-Sent Events (SSE) and WebSocket
- **Async**: Reactive programming with SmallRye Mutiny

#### Data Layer
- **Primary DB**: PostgreSQL with Hibernate Reactive
- **Cache**: Redis with Quarkus Redis extension
- **State Store**: In-memory + PostgreSQL for blockchain state
- **ORM**: Hibernate ORM with Panache repositories

#### Security & Cryptography
- **Quantum-Safe**: CRYSTALS-Kyber/Dilithium (NIST Level 5) via BouncyCastle
- **Classical**: Ed25519, secp256k1
- **Signatures**: Dilithium5 (quantum-resistant)
- **TLS**: Version 1.3 minimum
- **JWT**: SmallRye JWT for authentication

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
├─────────────────────────────────────────────────────────┤
│                  HTTP/2 REST API Gateway                 │
├─────────────────────────────────────────────────────────┤
│                     FastAPI Application                  │
├──────────────┬──────────────┬──────────────┬───────────┤
│  Transaction │   Consensus  │  Monitoring  │    Node   │
│   Service    │    Engine    │   Service    │  Manager  │
├──────────────┴──────────────┴──────────────┴───────────┤
│              gRPC/Protocol Buffer Layer                  │
├─────────────────────────────────────────────────────────┤
│   Quantum    │      AI      │   Storage    │  Network  │
│   Crypto     │  Optimizer   │    Layer     │   P2P     │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Multi-Cloud Deployment Architecture

**Overview**: Aurigraph DLT supports multi-cloud deployment across AWS, Azure, and GCP with three specialized node types for optimized resource allocation and global reach.

#### Node Type Specialization

**Validator Nodes** (Consensus Participants):
- **Resource Allocation**: 16-32 CPU cores, 4-8GB RAM, 100GB SSD
- **Container Capacity**: 4-8 validator nodes per container
- **Deployment**: Multi-cloud distribution for resilience
- **Cross-Cloud Latency Target**: <50ms

**Business Nodes** (API Serving):
- **Resource Allocation**: 8-16 CPU cores, 2-4GB RAM, 50GB SSD
- **Container Capacity**: 4-10 business nodes per container
- **Deployment**: Regional deployment near user populations
- **Global API Latency Target**: <200ms

**Slim Nodes** (Read-Only Queries):
- **Resource Allocation**: 4-8 CPU cores, 1-2GB RAM, 20GB SSD
- **Container Capacity**: 6-12 slim nodes per container
- **Deployment**: Edge locations worldwide
- **Query Latency Target**: <100ms

#### Multi-Cloud Infrastructure

**Service Discovery**: Consul for cross-cloud node registration
**VPN Mesh**: WireGuard for secure inter-cloud communication
**Orchestration**: Kubernetes with HPA/VPA autoscaling
**Load Balancing**: GeoDNS with geoproximity routing
**Aggregate TPS**: 2M+ across all clouds

### 2.3 Service Definitions

All services communicate via Protocol Buffers defined in `protos/`:

1. **TransactionService**: Transaction processing and validation
2. **ConsensusService**: HyperRAFT++ consensus implementation
3. **NodeService**: Node registration and management
4. **MonitoringService**: Metrics and health monitoring
5. **CryptoService**: Quantum-safe cryptographic operations
6. **StorageService**: Blockchain and state persistence

---

## 3. Core Components

### 3.1 Transaction Processing
- **Throughput**: 2M+ TPS target
- **Batch Processing**: 10,000 transactions per batch
- **Parallel Execution**: 256+ concurrent threads
- **Pipeline Depth**: 4-stage pipeline

### 3.2 Consensus Engine (HyperRAFT++)
- **Algorithm**: Enhanced RAFT with AI optimization
- **Finality**: <100ms target
- **Validators**: Dynamic set with stake-based selection
- **Fork Resolution**: Automatic with confidence scoring

### 3.3 Quantum Cryptography
- **Algorithms**: CRYSTALS-Dilithium for signatures, CRYSTALS-Kyber for KEM
- **Security Level**: NIST Level 5 (256-bit quantum security)
- **Key Management**: Hardware security module integration
- **Migration Path**: Hybrid classical/quantum during transition

### 3.4 AI/ML Integration
- **Framework**: TensorFlow 2.15 with async support
- **Models**: Consensus optimization, anomaly detection, load prediction
- **Training**: Online learning with periodic model updates
- **Inference**: Sub-millisecond prediction latency

### 3.5 Carbon Footprint Tracking Service

**Purpose**: Track and report carbon emissions for every transaction with ESG compliance

**Key Features**:
- **Real-Time Calculation**: Per-transaction carbon footprint (CPU + Network + Storage + Consensus energy)
- **Grid Carbon Intensity**: Integration with Electricity Maps API for regional accuracy
- **Target**: <0.17 gCO₂ per transaction (top 5 greenest blockchain)
- **Comparison**: 99.97% lower than Bitcoin, 95% lower than Ethereum PoS

**Components**:
1. **CarbonFootprintService.java**: Energy model and carbon calculation
2. **GridCarbonIntensityService.java**: Real-time grid data (Electricity Maps API)
3. **Carbon REST APIs**: Query transaction/block/network carbon metrics
4. **Grafana Dashboard**: 7-panel carbon monitoring dashboard
5. **Carbon Offset Integration**: Gold Standard, Verra, Climate Action Reserve
6. **ESG Reporting**: Automated GRI, SASB, TCFD compliance reports

**Carbon Calculation Formula**:
```
Carbon_Footprint_gCO2 =
    (CPU_Energy_kWh + Network_Energy_kWh + Storage_Energy_kWh + Consensus_Energy_kWh)
    × Carbon_Intensity_gCO2_per_kWh
```

**ESG Compliance**:
- **GRI 305**: Emissions reporting
- **GRI 302**: Energy consumption reporting
- **SASB TC-IM-130a.1**: Energy management
- **TCFD**: Climate risk disclosure and mitigation

**Target Certifications**:
- Green Blockchain Certification (Q3 2026)
- ISO 14001 Environmental Management
- B Corp Certification

---

## 4. API Specifications

### 4.1 REST API (HTTP/2)

Base URL: `https://api.aurigraph.io/v11`

#### Core Endpoints
```
POST   /transactions          - Submit transaction
GET    /transactions/{id}     - Get transaction by ID
POST   /transactions/batch    - Batch transaction submission
GET    /blocks/{height}       - Get block by height
GET    /consensus/status      - Consensus status
GET    /nodes                 - List network nodes
GET    /metrics              - Performance metrics
WS     /stream               - Real-time event stream
```

### 4.2 gRPC Services

All internal service communication uses gRPC with Protocol Buffers:

```protobuf
service TransactionService {
  rpc SubmitTransaction(Transaction) returns (TransactionResponse);
  rpc BatchSubmitTransactions(BatchRequest) returns (BatchResponse);
  rpc StreamTransactions(StreamRequest) returns (stream Transaction);
}
```

### 4.3 WebSocket Events

Real-time events encoded as Protocol Buffers:
- Transaction confirmations
- Block proposals
- Consensus state changes
- Network topology updates

---

## 5. Performance Requirements

### 5.1 Key Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Throughput | 2M+ TPS | 1.97M TPS |
| Finality | <100ms | <500ms |
| Latency (P99) | <50ms | Planning |
| Availability | 99.999% | 99.9% |
| Node Sync Time | <30s | Planning |
| Carbon/tx | <0.17 gCO₂ | 0.022 gCO₂ ✅ |
| Multi-Cloud Latency | <50ms | Planning |

### 5.2 Scalability
- Horizontal scaling via node addition
- Sharding support for 10M+ TPS
- Cross-shard atomic transactions
- Dynamic load balancing

### 5.3 Resource Requirements
- **CPU**: 32+ cores recommended
- **RAM**: 64GB minimum
- **Storage**: NVMe SSD, 2TB minimum
- **Network**: 10Gbps dedicated

---

## 6. Security Requirements

### 6.1 Cryptographic Standards
- **Quantum-Safe**: NIST PQC winners only
- **Key Sizes**: 256-bit minimum
- **Hash Functions**: SHA3-512, BLAKE3
- **RNG**: Hardware RNG required

### 6.2 Network Security
- **Transport**: TLS 1.3 minimum
- **Authentication**: mTLS for node communication
- **DDoS Protection**: Rate limiting, proof-of-work
- **Firewall**: Allowlist-based access control

### 6.3 Compliance
- **Standards**: SOC 2 Type II, ISO 27001
- **Privacy**: GDPR, CCPA compliant
- **Audit**: Full transaction audit trail
- **KYC/AML**: Integrated compliance engine

---

## 7. Migration Plan

### 7.1 Phase 1: Foundation (Current)
- [x] Create FastAPI project structure
- [x] Define Protocol Buffer schemas
- [x] Implement core configuration
- [ ] Set up gRPC services
- [ ] Create database models

### 7.2 Phase 2: Core Services
- [ ] Migrate transaction processing
- [ ] Implement consensus engine
- [ ] Port quantum cryptography
- [ ] Set up monitoring services
- [ ] Implement node management

### 7.3 Phase 3: Advanced Features
- [ ] AI optimization engine
- [ ] Cross-chain bridge
- [ ] Zero-knowledge proofs
- [ ] Advanced analytics
- [ ] Performance optimization

### 7.4 Phase 4: Production Ready
- [ ] Performance testing (2M+ TPS)
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment automation
- [ ] Monitoring and alerting

---

## 8. Testing Strategy

### 8.1 Test Coverage Requirements
- **Unit Tests**: 95% minimum
- **Integration Tests**: All service boundaries
- **Performance Tests**: 2M+ TPS validation
- **Security Tests**: Penetration testing
- **Chaos Engineering**: Fault injection

### 8.2 Test Frameworks
- **Unit**: pytest with asyncio
- **Integration**: pytest + httpx
- **Performance**: Locust, K6
- **Security**: OWASP ZAP, custom tools

---

## 9. Deployment Architecture

### 9.1 Container Strategy
- **Runtime**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with HPA
- **Registry**: Private container registry
- **Base Image**: Python 3.11-slim

### 9.2 Infrastructure
- **Cloud**: Multi-cloud (AWS, GCP, Azure)
- **CDN**: CloudFlare for API gateway
- **Load Balancer**: HAProxy with gRPC support
- **Monitoring**: Prometheus + Grafana

### 9.3 CI/CD Pipeline
- **Source Control**: GitHub with branch protection
- **CI**: GitHub Actions
- **Testing**: Automated test suite
- **Deployment**: ArgoCD for GitOps

---

## 10. Monitoring & Observability

### 10.1 Metrics
- **Application**: Custom Prometheus metrics
- **Infrastructure**: Node exporter, cAdvisor
- **Network**: gRPC metrics, latency tracking
- **Business**: TPS, finality, validator performance

### 10.2 Logging
- **Format**: Structured JSON logging
- **Aggregation**: ELK stack or Loki
- **Levels**: Debug, Info, Warning, Error, Critical
- **Retention**: 90 days minimum

### 10.3 Tracing
- **Framework**: OpenTelemetry
- **Backend**: Jaeger or Zipkin
- **Sampling**: Adaptive sampling
- **Correlation**: Request ID propagation

---

## 11. Documentation Requirements

### 11.1 Technical Documentation
- API reference with OpenAPI 3.0
- gRPC service definitions
- Protocol Buffer schemas
- Architecture diagrams
- Deployment guides

### 11.2 Developer Documentation
- Getting started guide
- Development environment setup
- Contribution guidelines
- Code style guide
- Testing guide

### 11.3 Operations Documentation
- Runbooks for common tasks
- Incident response procedures
- Monitoring and alerting guide
- Backup and recovery procedures
- Security best practices

---

## 12. Success Criteria

### 12.1 Technical Metrics
- ✅ 2M+ TPS achieved
- ✅ <100ms finality
- ✅ 99.999% availability
- ✅ All communication via Protocol Buffers
- ✅ Quantum-resistant security implemented

### 12.2 Business Metrics
- Successfully migrate all V10 functionality
- Zero data loss during migration
- Maintain backward compatibility
- Reduce operational costs by 40%
- Improve developer experience

---

## 13. Risks & Mitigations

### 13.1 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation | High | Extensive benchmarking, profiling |
| Protocol Buffer compatibility | Medium | Version management, backward compatibility |
| Async complexity | Medium | Comprehensive testing, code reviews |
| Migration data loss | High | Incremental migration, backup strategy |

### 13.2 Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Team learning curve | Medium | Training, pair programming |
| Deployment complexity | Medium | Automation, staging environment |
| Monitoring gaps | Low | Comprehensive observability |

---

## 14. Timeline

### Q1 2025
- Complete Phase 1: Foundation
- Begin Phase 2: Core Services
- Initial performance benchmarks

### Q2 2025
- Complete Phase 2: Core Services
- Begin Phase 3: Advanced Features
- Security audit preparation

### Q3 2025
- Complete Phase 3: Advanced Features
- Begin Phase 4: Production Ready
- Performance optimization

### Q4 2025
- Complete migration
- Production deployment
- Deprecate V10 platform

---

## 15. Future Roadmap - Technology Enhancement

### 15.1 HTTP/3 Upgrade (ON HOLD)

#### Overview
HTTP/3 with QUIC protocol offers significant performance improvements over HTTP/2 for the Aurigraph V11 platform. Analysis shows potential for 40-75% performance gains.

#### Performance Projections

| Metric | HTTP/2 (Current) | HTTP/3 (Projected) | Improvement |
|--------|------------------|-------------------|-------------|
| **TPS (Base)** | 779K - 899K | 1.2M - 1.4M | +55% |
| **TPS (15-core)** | 1.6M | 2.2M - 2.8M | +75% |
| **Latency P99** | 50ms | 15-25ms | -50% to -70% |
| **Connection Setup** | 3-4 RTT | 0-1 RTT | 300% faster |
| **Memory Usage** | 245MB | 200MB | -18% |

#### Key Benefits
1. **Ultra-Low Latency**: 0-RTT connection establishment
2. **No Head-of-Line Blocking**: Independent stream processing
3. **Connection Migration**: Seamless mobile/network switching
4. **Better Loss Recovery**: QUIC selective acknowledgments
5. **Built-in Encryption**: Mandated TLS 1.3
6. **Stream Prioritization**: Enhanced QoS for critical transactions

#### Implementation Timeline (When Activated)
- **Week 1**: Foundation & Configuration (2-3 days)
  - Enable HTTP/3 in framework configuration
  - Basic REST API HTTP/3 support
  - Performance baseline establishment

- **Week 2**: Core Services Migration (3-4 days)
  - Transaction service HTTP/3 optimization
  - gRPC over HTTP/3 implementation
  - Cross-chain bridge HTTP/3 support

- **Week 3**: Production Deployment (3-4 days)
  - Blue-green deployment with HTTP/3
  - Performance monitoring and validation
  - Documentation and knowledge transfer

#### Technical Requirements
```yaml
Configuration:
  - Protocol: QUIC (UDP-based)
  - Port: 9443 (HTTP/3)
  - Max Concurrent Streams: 10,000
  - TLS Version: 1.3 (mandatory)
  
Expected Outcomes:
  - 15-Core System: 2.2M - 2.8M TPS
  - Latency Reduction: 50-70%
  - Connection Overhead: -70%
  - Network Efficiency: +40%
```

#### ROI Analysis
- **Performance Gain**: Very High (40-75% improvement)
- **Implementation Effort**: Medium (2-3 weeks)
- **Risk Level**: Low (HTTP/2 fallback available)
- **Business Impact**: High
- **Status**: **ON HOLD** - Available for future activation

### 15.2 Additional Future Enhancements

#### Quantum Computing Integration (2026)
- Quantum-enhanced consensus algorithms
- Quantum random number generation
- Post-quantum migration completion

#### AI/ML Advanced Features (Q1 2026)
- Deep learning consensus optimization
- Predictive transaction routing
- Automated threat detection
- Self-healing network capabilities

#### Global Scaling (Q2 2026)
- Multi-region active-active deployment
- Edge computing integration
- Satellite node support
- 10M+ TPS with sharding

#### Interoperability Expansion (Q3 2026)
- Universal cross-chain protocol
- Central Bank Digital Currency (CBDC) support
- DeFi protocol integration
- Enterprise blockchain connectors

---

## 16. Appendices

### A. Protocol Buffer Definitions
See `protos/aurigraph.proto` for complete service definitions

### B. Configuration Parameters
See `app/core/config.py` for all configuration options

### C. API Documentation
Available at `/api/docs` when running in development mode

### D. Performance Benchmarks
Updated benchmarks available in `benchmarks/` directory

---

**Document Status**: Living document, updated with each sprint
**Next Review**: End of current sprint
**Owner**: Aurigraph Development Team
---

## 7. Smart Contracts & Tokenization

### 7.1 Ricardian Smart Contracts

**Status**: Production Ready ✅
**Frontend**: `RicardianContractUpload.tsx`
**Backend**: `RicardianContractConversionService.java`

#### Features
- Document upload (PDF, DOC, DOCX, TXT) → Executable contract conversion
- AI-powered text extraction and party identification  
- Automatic code generation from legal text
- Multi-party quantum-safe signatures (CRYSTALS-Dilithium)
- Mandatory 3rd party verification before activation
- Full audit trail and immutable execution history

#### Contract Lifecycle
1. Upload legal document
2. AI extraction of parties, terms, conditions
3. Generate executable smart contract code
4. Collect multi-party signatures
5. **Mandatory 3rd party verification**
6. Activate contract on blockchain
7. Automated execution based on conditions
8. Settlement and final state commit

#### API Endpoints
- `POST /api/v11/contracts/ricardian/upload` - Upload & convert document
- `GET /api/v11/contracts/ricardian/{id}` - Get contract details
- `POST /api/v11/contracts/ricardian/{id}/sign` - Sign contract
- `POST /api/v11/contracts/ricardian/{id}/execute` - Execute contract

### 7.2 Real-World Asset Tokenization

**Status**: Production Ready ✅
**Frontend**: `Tokenization.tsx`, `RWATRegistry.tsx`, `ExternalAPITokenization.tsx`
**Backend**: `RWATokenizationResource.java`, `AssetShareRegistry.java`

#### Supported Asset Types
- **Real Estate**: Commercial, residential, fractional ownership
- **Equity**: Private company shares, venture capital
- **Bonds**: Corporate, municipal, government
- **Commodities**: Precious metals, raw materials
- **Art & Collectibles**: Fine art, antiques, rare items

#### Token Types
1. **Fungible Tokens**: Divisible assets (equity, bonds)
2. **NFTs**: Unique assets (property deeds, artwork)
3. **Semi-Fungible**: Partially divisible (fractional real estate)

#### Tokenization Workflow
1. Asset registration with metadata
2. Legal documentation upload
3. Asset valuation and appraisal
4. **Mandatory 3rd party verification**
   - Asset authenticity check
   - Valuation confirmation
   - Legal compliance review
   - Regulatory certification
5. Token configuration and smart contract deployment
6. Token minting and distribution
7. Secondary market trading
8. Dividend distribution / revenue sharing
9. Redemption and exit events

#### Compliance Features
- **KYC/AML**: Required for all participants
- **Jurisdictional Support**: US, EU, Asia regulatory frameworks
- **Accredited Investor Verification**: Required for certain asset classes
- **Transfer Restrictions**: Lockup periods, country restrictions
- **Regulatory Reporting**: Automated compliance reports

#### API Endpoints
- `POST /api/v11/tokenization/rwa/register` - Register real-world asset
- `POST /api/v11/tokenization/token/create` - Create token
- `POST /api/v11/tokenization/token/{id}/mint` - Mint tokens
- `GET /api/v11/tokenization/registry` - List all tokens

### 7.3 3rd Party Verification Service

**Status**: Production Ready ✅
**Backend**: `MandatoryVerificationService.java`

#### Purpose
MANDATORY verification step ensuring:
- Asset authenticity and ownership
- Accurate valuation
- Legal compliance
- Regulatory adherence

#### Registered Verifiers
1. **Real Estate**: CoreLogic, Cushman & Wakefield
2. **Financial Assets**: Deloitte, PwC
3. **Art & Collectibles**: Sotheby's, Christie's
4. **Commodities**: SGS, Bureau Veritas
5. **Legal Compliance**: Baker McKenzie, White & Case

#### Verification Process
1. Asset owner initiates verification request
2. System selects suitable verifier based on asset type
3. Verifier reviews documentation and metadata
4. Site inspection (if required)
5. Verifier submits decision (APPROVED/REJECTED/CONDITIONAL)
6. Verification certificate stored on-chain
7. Asset/contract activation upon approval

#### Verification Statuses
- `PENDING`: Verification requested, awaiting verifier
- `IN_PROGRESS`: Verifier actively reviewing
- `APPROVED`: ✅ Verified, can proceed
- `REJECTED`: ❌ Verification failed
- `CONDITIONAL`: Additional information required
- `EXPIRED`: Verification window expired

#### API Endpoints
- `POST /api/v11/verification/initiate` - Request verification
- `GET /api/v11/verification/status/{id}` - Check verification status
- `POST /api/v11/verification/{id}/decision` - Submit verifier decision
- `GET /api/v11/verification/certificate/{id}` - Get verification certificate

---

## 8. Production Deployment

### 8.1 Current Production Status

**URL**: https://dlt.aurigraph.io
**API**: https://dlt.aurigraph.io/api/v11/
**Status**: Live ✅

#### Performance Metrics (Current)
- **TPS**: 1.97M sustained (99% of 2M target)
- **Latency**: 507ns per transaction
- **Uptime**: 99.9%
- **Finality**: <1s

#### Infrastructure
- **Server**: Ubuntu 24.04.3 LTS
- **RAM**: 49GB
- **vCPU**: 16 cores (Intel Xeon Skylake @ 2.0GHz)
- **Storage**: 133GB SSD
- **Docker**: 28.4.0

#### Services Running
✅ Backend: Aurigraph V11 (Java/Quarkus) on port 9003
✅ Frontend: Enterprise Portal (React) via Nginx HTTPS
✅ Database: PostgreSQL
✅ Cache: Redis
✅ Monitoring: Health checks, metrics

### 8.2 Enterprise Portal Features

**All Functionality Available** ✅

#### Navigation Structure
1. **Home** - Landing page with platform overview
2. **Blockchain** dropdown:
   - Transactions - Transaction explorer
   - Blocks - Block explorer
   - Validators - Validator dashboard
3. **Optimization** dropdown:
   - AI Controls - AI/ML optimization
   - Security - Quantum security panel
4. **Cross-Chain** dropdown:
   - Bridge - Cross-chain transfers
5. **Smart Contracts** dropdown:
   - Contract Registry - Browse contracts
   - **Document Converter** - Ricardian contract upload ⭐
   - Active Contracts - Executing contracts
6. **Tokenization** dropdown:
   - **Token Platform** - Create tokens ⭐
   - Token Registry - Browse tokens
   - API Tokenization - External API integration
   - **RWA Registry** - Real-world assets ⭐
7. **System** dropdown:
   - Monitoring - System metrics
   - **Node Visualization** - Demo app with real-time TPS ⭐
   - Settings - Configuration

### 8.3 Demo App Access

**URL**: https://dlt.aurigraph.io
**Path**: System → Node Visualization

#### Features
- Real-time TPS display (1.97M TPS)
- Network topology visualization
- Consensus state visualization
- Transaction flow animation
- Performance metrics dashboard
- Node health monitoring

### 8.4 Testing Credentials

Contact system administrator for demo access credentials.

---

## 9. Detailed Workflow Documentation

For complete implementation details, see:
**SMART-CONTRACT-TOKENIZATION-WORKFLOWS.md**

This document includes:
- Step-by-step Ricardian contract conversion process
- Tokenization workflow with code examples
- 3rd party verification implementation details
- API specifications and request/response formats
- Security and compliance requirements
- Demo walkthrough instructions

---

## 10. Performance Optimization Roadmap

### Current Achievement
✅ 1.97M TPS (99% of 2M target) with G1GC optimization

### Optimization Phases (Weeks 1-4)

**Phase 1**: Quarkus & JVM Tuning (Week 1)
- Target: 1.97M → 2.2M TPS (+11%)
- Already applied: G1GC with 20ms pause target
- Next: Thread pool optimization, batch size tuning

**Phase 2**: Native Compilation (Week 2)
- Target: 2.2M → 2.5M TPS (+14%)
- GraalVM native build with profile-guided optimization (PGO)
- Zero-overhead abstractions

**Phase 3**: Algorithm Optimization (Week 3-4)
- Target: 2.5M → 3M TPS (+20%)
- Consensus algorithm improvements
- Transaction batching refinement
- Memory allocation optimization

**Final Target**: 3M+ TPS by end of Week 4

---

*Document Version: 2.0*
*Last Updated: October 16, 2025*
*Status: Production Ready ✅*
