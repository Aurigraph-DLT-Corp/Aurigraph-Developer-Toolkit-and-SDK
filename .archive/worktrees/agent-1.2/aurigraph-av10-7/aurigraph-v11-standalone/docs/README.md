# Aurigraph V11 Documentation

**Complete technical documentation for the Aurigraph V11 DLT platform.**

## Table of Contents

- [Quick Start](#quick-start)
- [Documentation Structure](#documentation-structure)
- [API Reference](#api-reference)
- [User Guides](#user-guides)
- [Architecture Decisions](#architecture-decisions)
- [Contributing](#contributing)

## Quick Start

### New to Aurigraph V11?

1. **[Getting Started Guide](./guides/GETTING-STARTED.md)** - Install, configure, and run your first transaction
2. **[API Overview](./api/README.md)** - Explore the REST API with Swagger UI
3. **[Developer Guide](./guides/DEVELOPER-GUIDE.md)** - Build applications on Aurigraph V11

### For Operators

1. **[Operations Guide](./operations/OPERATIONS-GUIDE.md)** - Deploy and manage production systems
2. **[Deployment Runbook](./operations/DEPLOYMENT-RUNBOOK.md)** - Step-by-step deployment procedures
3. **[Troubleshooting Guide](./operations/TROUBLESHOOTING-GUIDE.md)** - Common issues and solutions

## Documentation Structure

```
docs/
├── README.md                          # This file
├── api/                               # API Documentation
│   ├── README.md                      # API overview and examples
│   └── aurigraph-v11-openapi.yaml     # OpenAPI 3.0 specification
├── guides/                            # User Guides
│   ├── GETTING-STARTED.md             # Quick start guide
│   └── DEVELOPER-GUIDE.md             # Developer handbook
├── operations/                        # Operations Guides
│   ├── OPERATIONS-GUIDE.md            # Deployment and operations
│   ├── DEPLOYMENT-RUNBOOK.md          # Deployment procedures
│   └── TROUBLESHOOTING-GUIDE.md       # Common issues
└── adr/                               # Architecture Decision Records
    ├── 0001-java-quarkus-graalvm-stack.md
    ├── 0002-hyperraft-consensus.md
    └── 0003-quantum-resistant-cryptography.md
```

## API Reference

### REST API

- **Base URL**: `https://dlt.aurigraph.io/api/v11` (Production)
- **Base URL**: `http://localhost:9003/api/v11` (Development)

### Interactive Documentation

- **Swagger UI**: http://localhost:9003/q/swagger-ui
- **ReDoc**: http://localhost:9003/q/redoc
- **Dev UI**: http://localhost:9003/q/dev

### Core Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| **Platform** | `GET /health` | Health check and uptime |
| **Platform** | `GET /info` | System information |
| **Platform** | `GET /system/status` | Comprehensive system status |
| **Blockchain** | `POST /blockchain/transactions` | Process transaction |
| **Blockchain** | `GET /blockchain/latest` | Get latest block |
| **Blockchain** | `GET /blockchain/stats` | Blockchain statistics |
| **Consensus** | `GET /consensus/status` | HyperRAFT++ status |
| **Consensus** | `GET /consensus/metrics` | Consensus metrics |
| **Crypto** | `POST /crypto/keystore/generate` | Generate quantum keys |
| **Crypto** | `POST /crypto/sign` | Sign with Dilithium |
| **AI/ML** | `GET /ai/status` | AI system status |
| **AI/ML** | `GET /ai/predictions` | Network predictions |
| **Performance** | `GET /performance` | Run performance test |

### Quick Examples

#### Health Check
```bash
curl http://localhost:9003/api/v11/health
```

#### Process Transaction
```bash
curl -X POST http://localhost:9003/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "tx-001", "amount": 100.00}'
```

#### Get Blockchain Stats
```bash
curl http://localhost:9003/api/v11/blockchain/stats
```

## User Guides

### For Developers

1. **[Getting Started](./guides/GETTING-STARTED.md)**
   - Prerequisites and installation
   - Quick start tutorial
   - Your first transaction
   - Common use cases

2. **[Developer Guide](./guides/DEVELOPER-GUIDE.md)**
   - Architecture overview
   - Core concepts (reactive programming, virtual threads)
   - Building applications
   - Testing best practices
   - Performance optimization

3. **[API Reference](./api/README.md)**
   - Complete API documentation
   - Request/response examples
   - Authentication and rate limiting
   - Error handling

### For Operators

1. **[Operations Guide](./operations/OPERATIONS-GUIDE.md)**
   - Deployment strategies
   - Configuration management
   - Monitoring and alerting
   - Backup and recovery
   - Scaling procedures

2. **[Deployment Runbook](./operations/DEPLOYMENT-RUNBOOK.md)**
   - Pre-deployment checklist
   - Step-by-step deployment
   - Post-deployment validation
   - Rollback procedures

3. **[Troubleshooting Guide](./operations/TROUBLESHOOTING-GUIDE.md)**
   - Common issues and solutions
   - Performance troubleshooting
   - Network issues
   - Database problems
   - Log analysis

## Architecture Decisions

Architecture Decision Records (ADRs) document key technical decisions:

### Core Technology Stack

**[ADR-0001: Java 21 + Quarkus + GraalVM](./adr/0001-java-quarkus-graalvm-stack.md)**

- **Decision**: Java 21 with Quarkus and GraalVM native compilation
- **Rationale**: Ultra-high performance, sub-second startup, virtual threads
- **Status**: ✅ Implemented (776K TPS, optimizing to 3M+)

**Key Points**:
- Java 21 virtual threads for massive concurrency
- GraalVM native compilation (<1s startup, <256MB RAM)
- Quarkus reactive programming with Mutiny
- HTTP/2 + gRPC for high-performance communication

### Consensus Algorithm

**[ADR-0002: HyperRAFT++ Consensus](./adr/0002-hyperraft-consensus.md)**

- **Decision**: HyperRAFT++ (optimized RAFT variant)
- **Rationale**: 3M+ TPS, sub-100ms finality, AI optimization
- **Status**: ✅ Implemented (776K TPS, 485ms finality, optimizing)

**Key Points**:
- Leader-based consensus with O(n) message complexity
- Pipelined proposals (40+ depth) and adaptive batching (150K txs/batch)
- 768+ parallel execution threads
- AI-driven optimization (23.5% latency reduction)

### Cryptography

**[ADR-0003: Quantum-Resistant Cryptography](./adr/0003-quantum-resistant-cryptography.md)**

- **Decision**: CRYSTALS-Kyber/Dilithium (NIST Level 5)
- **Rationale**: Protection against quantum computer attacks
- **Status**: ✅ Implemented (8K signatures/sec)

**Key Points**:
- NIST-standardized post-quantum cryptography
- Kyber-1024 for key encapsulation (9.5K ops/sec)
- Dilithium5 for digital signatures (8K sigs/sec)
- 256-bit post-quantum security

## Key Features

### Ultra-High Performance

- **Target**: 3M+ TPS (current: 776K TPS)
- **Finality**: Sub-100ms (current: 485ms)
- **Startup**: <1 second (native mode)
- **Memory**: <256MB RAM footprint

### Quantum-Resistant Security

- **Algorithms**: CRYSTALS-Kyber/Dilithium
- **Security Level**: NIST Level 5 (256-bit post-quantum)
- **Performance**: 8,000 signatures/second
- **Compliance**: NIST FIPS 204 standard

### AI-Driven Optimization

- **ML Models**: 5 active models (consensus, prediction, anomaly detection)
- **Performance Gain**: 18.2% throughput increase
- **Latency Reduction**: 23.5% improvement
- **Accuracy**: 95.7% average model accuracy

### Advanced Features

- **Virtual Threads**: Java 21 for massive concurrency
- **Reactive Programming**: Mutiny for non-blocking operations
- **Native Compilation**: GraalVM for optimal performance
- **Cross-Chain Bridge**: Multi-chain interoperability
- **RWA Tokenization**: Real-world asset support

## Technology Stack

### Core Platform

- **Java**: 21 with Virtual Threads
- **Framework**: Quarkus 3.26.2
- **Runtime**: GraalVM native compilation
- **Protocol**: HTTP/2 + gRPC + Protocol Buffers

### Consensus & Cryptography

- **Consensus**: HyperRAFT++ (768+ parallel threads)
- **Cryptography**: CRYSTALS-Kyber/Dilithium (NIST Level 5)
- **Signatures**: BouncyCastle library

### Storage & Database

- **Primary DB**: PostgreSQL (ACID transactions)
- **State Store**: LevelDB (embedded, per-node)
- **Verification**: Merkle tree registry

### AI/ML

- **Framework**: DeepLearning4J
- **Libraries**: Apache Commons Math, SMILE ML
- **Models**: Random Forest, Gradient Boosting, LSTM

### Monitoring & Observability

- **Metrics**: Prometheus + Micrometer
- **Health Checks**: Quarkus SmallRye Health
- **Logging**: Structured JSON logging (ELK-compatible)

## Performance Benchmarks

### Current Performance (October 2025)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Throughput** | 776K TPS | 3M+ TPS | 🔄 Optimizing |
| **Finality** | 485ms | <100ms | 🔄 Optimizing |
| **Startup Time** | <1s | <1s | ✅ Achieved |
| **Memory** | <256MB | <256MB | ✅ Achieved |
| **Consensus Latency** | 42ms | <50ms | ✅ Achieved |
| **Crypto Throughput** | 8K sigs/s | 10K sigs/s | 🔄 Optimizing |

### Optimization Targets

1. **Transaction Processing**: Adaptive batching (150K txs/batch)
2. **Consensus**: Pipelined proposals (40+ depth)
3. **Parallel Execution**: 768+ threads
4. **AI Optimization**: ML-based throughput tuning

## Development

### Getting Started

```bash
# Clone repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Start development server
./mvnw quarkus:dev

# Access Swagger UI
open http://localhost:9003/q/swagger-ui
```

### Building

```bash
# Standard build
./mvnw clean package

# Native build (fast)
./mvnw package -Pnative-fast

# Native build (production)
./mvnw package -Pnative
```

### Testing

```bash
# All tests
./mvnw test

# Specific test
./mvnw test -Dtest=AurigraphResourceTest

# With coverage
./mvnw test jacoco:report
```

## Contributing

### Code Contributions

1. Fork the repository
2. Create feature branch: `feature/AV11-XXX-description`
3. Write tests (95% coverage required)
4. Submit pull request
5. Address review comments

### Documentation Contributions

1. Check existing documentation
2. Create/update markdown files
3. Test examples and code snippets
4. Submit pull request

### Reporting Issues

- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **JIRA**: https://aurigraphdlt.atlassian.net
- **Email**: support@aurigraph.io

## Support

### Documentation

- **Getting Started**: [guides/GETTING-STARTED.md](./guides/GETTING-STARTED.md)
- **Developer Guide**: [guides/DEVELOPER-GUIDE.md](./guides/DEVELOPER-GUIDE.md)
- **API Reference**: [api/README.md](./api/README.md)

### Community

- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA**: https://aurigraphdlt.atlassian.net
- **Email**: support@aurigraph.io

### Commercial Support

Contact: enterprise@aurigraph.io

## License

Proprietary - Aurigraph Corporation

Copyright (c) 2025 Aurigraph Corporation. All rights reserved.

---

**Built with Java 21, Quarkus, and GraalVM for ultimate performance and scalability.**
