# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aurigraph DLT V12** is a high-performance blockchain platform built on Java 21/Quarkus/GraalVM architecture. The platform delivers 2M+ TPS performance with quantum-resistant cryptography (NIST Level 5), HyperRAFT++ consensus algorithm, AI-driven transaction optimization, real-world asset tokenization (RWAT), cross-chain bridges, and enterprise DAO governance.

**Current Status (December 2025)** - V12 BASELINE:
- V12 (Java/Quarkus): PRIMARY PRODUCTION PLATFORM - 2M+ TPS target, 776K+ verified baseline
- Enterprise Portal: v4.5.0+ live at https://dlt.aurigraph.io
- Mobile Validator: Q2 2026 launch (iOS/Android)
- Website: Q1 2026 launch (Aurigraph.io redesign)
- V10 (Legacy): ARCHIVED - No longer maintained

## Repository Structure - V12 Baseline

```
Aurigraph-DLT-Fresh-12/           # V12 PRIMARY REPOSITORY
├── aurigraph-v12/                # Main V12 development (Java/Quarkus - PRIMARY)
│   ├── aurigraph-core/           # Core blockchain components
│   ├── aurigraph-proto/          # Protocol Buffer definitions  
│   ├── aurigraph-platform-service/ # Main platform service
│   ├── crosschain-bridge/        # Cross-chain bridge (multi-chain support)
│   ├── rwa-tokenization/         # Real-World Asset Tokenization
│   ├── governance/               # DAO governance contracts
│   └── aurigraph-v12-standalone/ # Standalone service
│       └── pom.xml               # Maven config (Quarkus 3.26+, Java 21)
├── docs/                         # V12 Documentation (PRIMARY)
│   ├── architecture/             # V12 system design
│   ├── development/              # V12 development guides
│   ├── sdks/                     # RWAT SDK documentation
│   ├── mobile/                   # Mobile validator app docs
│   ├── website/                  # Aurigraph.io website docs
│   ├── jira/                     # JIRA ticket planning
│   ├── legal/                    # Legal/compliance documentation
│   └── team/                     # Team and SME definitions
├── enterprise-portal/            # React/TypeScript frontend (v4.5.0+)
│   └── enterprise-portal/frontend/
├── deployment/                   # V12 production deployment
│   └── docker-compose.yml
├── scripts/                      # Development & deployment scripts
│   ├── ci-cd/                    # CI/CD automation
│   ├── deployment/               # Deployment scripts
│   ├── setup/                    # Setup and configuration
│   └── monitoring/               # Monitoring and observability
├── package.json                  # Root package configuration
├── ARCHITECTURE.md               # V12 system architecture
├── DEVELOPMENT.md                # V12 development guide
├── CLAUDE.md                     # V12 development guidance (this file)
└── start-v12.sh                  # V12 quick start script (PRIMARY)

Legacy Repositories (ARCHIVED):
├── /Aurigraph-DLT/              # V11 archived (reference only)
└── aurigraph-v9/                # V9 archived (deprecated)
```

## Build & Development Commands - V12 PRIMARY

### V12 (Java/Quarkus) - PRIMARY DEVELOPMENT TARGET

```bash
# Quick start V12
npm run start:v12              # JVM mode with hot reload (port 9003)
npm run start:v12:dev          # Development mode with debugging
npm run start:v12:native       # Native compilation mode (optimized)

# Direct Maven commands (from aurigraph-v12/aurigraph-v12-standalone/)
cd aurigraph-v12/aurigraph-v12-standalone
./mvnw quarkus:dev             # Dev mode with hot reload (port 9003)
./mvnw quarkus:dev -Ddebug=5005 # Dev mode with remote debugging
./mvnw clean package           # Build JAR artifact
./mvnw test                    # Run all unit tests
./mvnw test -Dtest=AurigraphResourceTest # Run specific test class
./mvnw verify                  # Run tests + coverage analysis
./mvnw package -Pnative-fast   # Fast native build (~2 min, dev)
./mvnw package -Pnative        # Standard native build (~15 min, prod)
./mvnw package -Pnative-ultra  # Ultra-optimized build (~30 min, max perf)

# Run the built artifact
java -jar target/quarkus-app/quarkus-run.jar  # JVM mode
./target/aurigraph-v12-standalone-12.0.0-runner  # Native executable
```

### Enterprise Portal (React/TypeScript)

```bash
# From enterprise-portal/enterprise-portal/frontend/
cd enterprise-portal/enterprise-portal/frontend
npm install
npm run dev                    # Development server (port 3000)
npm run build                  # Production build
npm start                      # Production server
```

### Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.production.yml up -d

# Development deployment
docker-compose -f deployment/docker-compose.yml up -d

# V11 testnet
cd aurigraph-av10-7
docker-compose -f docker-compose.testnet.yml up -d
```

## Common Development Tasks

### Running Tests

```bash
# V11 Java tests
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test                              # All tests
./mvnw test -Dtest=AurigraphResourceTest # Specific test class
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput  # Specific test method

# Test coverage
./mvnw verify                            # Run tests with coverage report
# Coverage reports available at: target/site/jacoco/index.html
```

### Debugging

```bash
# V11 with remote debugging
./mvnw quarkus:dev -Ddebug=5005

# Check service health
curl http://localhost:9003/q/health
curl http://localhost:9003/q/metrics

# View logs
docker-compose -f docker-compose.production.yml logs -f nginx-gateway
docker-compose -f docker-compose.production.yml logs -f enterprise-portal
```

### Building Native Images

```bash
# Native compilation requires Docker
cd aurigraph-av10-7/aurigraph-v11-standalone

# Fast build (development)
./mvnw package -Pnative-fast -Dquarkus.native.container-build=true

# Production build (optimized)
./mvnw package -Pnative -Dquarkus.native.container-build=true

# Run native executable
./target/aurigraph-v11-standalone-11.0.0-runner
```

## Architecture

### Technology Stack - V12 BASELINE

**V12 (Java/Quarkus) - PRODUCTION ARCHITECTURE**:
- **Runtime**: Java 21 with Virtual Threads (lightweight concurrency)
- **Framework**: Quarkus 3.26+ (cloud-native, GraalVM-optimized)
- **Build Tool**: Maven 3.9+ with custom plugins
- **Communication**: REST API (current), gRPC (Phase 2), WebSocket (real-time)
- **Database**: PostgreSQL 16 with Panache (ORM), RocksDB for local state
- **Reactive**: Mutiny for async/non-blocking streams
- **Cryptography**: CRYSTALS-Dilithium/Kyber (quantum-resistant, NIST Level 5)
- **Native**: GraalVM for <1s startup, <256MB memory
- **Ports**: 9003 (HTTP/2, REST), 9004 (gRPC, planned)

**Enterprise Portal**:
- **Frontend**: React 18 + TypeScript + Material-UI
- **API Client**: Axios with auto-refresh (5-second intervals)
- **Charts**: Recharts for data visualization
- **State**: Redux/React hooks
- **Deployment**: Docker + NGINX

**Infrastructure**:
- **API Gateway**: NGINX with TLS 1.3
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Monitoring**: Prometheus + Grafana
- **IAM**: Keycloak 24.0+ (port 8180, https://iam2.aurigraph.io)

### Key Components - V12

**V12 Core Services** (`aurigraph-v12/aurigraph-v12-standalone/src/main/java/io/aurigraph/v12/`):
- `AurigraphResource.java` - Main REST API endpoints (2M+ TPS)
- `TransactionService.java` - Transaction processing, validation, ordering
- `ai/AIOptimizationService.java` - ML-driven transaction optimization (3M+ TPS capability)
- `consensus/HyperRAFTConsensusService.java` - Enhanced RAFT consensus (parallel log replication)
- `crypto/QuantumCryptoService.java` - NIST Level 5 quantum-resistant cryptography
- `bridge/CrossChainBridgeService.java` - Multi-chain bridge with validator consensus
- `registry/RWATRegistryService.java` - Real-world asset tokenization with Merkle trees
- `governance/DAOGovernanceService.java` - DAO token voting and governance
- `validator/ValidatorService.java` - Validator participation and rewards

**V12 API Endpoints** (Base: https://dlt.aurigraph.io/api/v12):
- `GET /health` - Health check (99.99% uptime SLA)
- `GET /info` - System info (version, capabilities, consensus state)
- `GET /stats` - Transaction statistics (TPS, finality, validators)
- `GET /analytics/dashboard` - Real-time analytics dashboard
- `GET /blockchain/transactions` - Transaction list (paginated, queryable)
- `GET /blockchain/blocks` - Block list with consensus data
- `GET /nodes` - Active validator node list
- `GET /consensus/status` - HyperRAFT++ consensus state
- `GET /governance/proposals` - Active governance proposals
- `POST /governance/vote` - Cast governance votes
- `POST /contracts/deploy` - Deploy smart contracts
- `POST /rwa/tokenize` - Tokenize real-world assets
- `POST /rwa/transfer` - Transfer RWA with cross-chain bridges
- `GET /validators/{id}/rewards` - Validator rewards tracking

### HyperRAFT++ Consensus

The platform uses an enhanced RAFT consensus algorithm with:
- Parallel log replication for higher throughput
- AI-driven optimization for transaction ordering
- Byzantine fault tolerance (f < n/3)
- Leader election timeout: 150-300ms
- Heartbeat interval: 50ms
- Strong consistency guarantees

### Multi-Cloud Deployment

**Production Architecture** (planned):
- **AWS** (us-east-1): 4 validator nodes, 6 business nodes, 12 slim nodes
- **Azure** (eastus): 4 validator nodes, 6 business nodes, 12 slim nodes
- **GCP** (us-central1): 4 validator nodes, 6 business nodes, 12 slim nodes
- **VPN Mesh**: WireGuard for secure inter-cloud communication
- **Service Discovery**: Consul with cross-cloud federation
- **Load Balancing**: GeoDNS with geoproximity routing

## Performance Benchmarks - V12 BASELINE

### V12 Current Performance (December 2025)
- **TPS Baseline**: 776K+ (production-verified on V11, V12 on-track)
- **TPS with ML Optimization**: 3.0M (lab benchmarks, on-path to sustained)
- **Target**: 2M+ sustained TPS (Q1 2026)
- **Startup**: <1s (native), ~3s (JVM with hot reload)
- **Memory**: <256MB (native), ~512MB (JVM)
- **Finality**: <500ms current, <100ms target (Q2 2026)
- **Block Confirmation**: ~2 seconds average
- **Carbon Footprint**: 0.022 gCO₂/tx (industry-leading, target: <0.17 gCO₂/tx)
- **Validator Rewards**: 5% APY (from transaction fees)
- **Network Size**: 100-500 validators (target 10,000 with mobile)

### Testing Requirements
- **Unit Test Coverage**: ≥80% mandatory
- **Integration Test Coverage**: ≥70% critical paths
- **E2E Tests**: 100% user flow coverage
- **Performance Tests**: Every release with TPS validation
- **Load Testing**: 24-hour sustained at 150% expected load

## V12 Development Status - BASELINE (December 2025)

**Phase 1 - Foundation** ✅ (100% Complete):
- Quarkus 3.26+ project structure
- REST API v12 endpoints (2M+ TPS capable)
- Transaction service with AI optimization
- Health check + metrics endpoints
- GraalVM native compilation
- JWT + OAuth 2.0 authentication
- Quantum-resistant cryptography (CRYSTALS)

**Phase 2 - Core Services** ✅ (95% Complete):
- HyperRAFT++ consensus (100% - AI optimization integrated)
- AI transaction optimization (100% - ML model deployed)
- RWAT registry with Merkle tree (100% - oracle integration live)
- Native build optimization (100% - GraalVM verified)
- Enterprise Portal v4.5.0+ (100% - live in production)
- Quantum crypto (100% - CRYSTALS-Dilithium/Kyber deployed)
- Cross-chain bridge (100% - multi-signature validator consensus)
- DAO governance contracts (100% - token voting live)

**Phase 3 - Ecosystem & Scale** 🚧 (40% Target):
- gRPC service layer (Planned Q1 2026)
- WebSocket real-time updates (Planned Q1 2026)
- 2M+ TPS sustained achievement (Target Q1 2026)
- Multi-cloud deployment (AWS/Azure/GCP - Planned Q2 2026)
- Mobile validator app (iOS/Android - Q2-Q4 2026)
- RWAT SDK ecosystem (TypeScript/Python/Go - Q1-Q3 2026)
- Website & marketing (Aurigraph.io - Q1 2026)
- Full test suite (95%+ coverage target - Q2 2026)

## Configuration - V12 BASELINE

### Environment Variables

**V12 Configuration** (aurigraph-v12/aurigraph-v12-standalone/src/main/resources/application.properties):
```properties
# Server Configuration
quarkus.http.port=9003
quarkus.http.host=0.0.0.0
quarkus.http.http2=true
quarkus.http.cors=true

# Native Compilation
quarkus.native.container-build=true
quarkus.native.builder-image=graalvm

# Database
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_v12
quarkus.datasource.username=aurigraph
quarkus.datasource.password=${DB_PASSWORD}

# Consensus & Blockchain
aurigraph.consensus.algorithm=hyperraft++
aurigraph.consensus.timeout=150
aurigraph.consensus.finality=500
aurigraph.validators.min-stake=10000
aurigraph.validators.reward-rate=0.05
```

**Enterprise Portal** (V12):
```env
API_BASE_URL=https://dlt.aurigraph.io/api/v12
DOMAIN=dlt.aurigraph.io
NODE_ENV=production
VERSION=4.5.0
```

**IAM Configuration** (Keycloak V24+):
- Server: https://iam2.aurigraph.io/
- Realms: AWD (primary), AurCarbonTrace, AurHydroPulse
- Client ID: aurigraph-platform
- Auth: OAuth 2.0 + OpenID Connect + JWT
- Scopes: openid profile email roles

## Security & Cryptography

**Quantum-Resistant Cryptography**:
- **CRYSTALS-Dilithium**: Digital signatures (NIST Level 5)
  - Key Size: 2,592 bytes (public), 4,896 bytes (private)
  - Signature Size: 3,309 bytes
- **CRYSTALS-Kyber**: Encryption (Module-LWE)
  - Key Size: 1,568 bytes (public), 3,168 bytes (private)
  - Ciphertext Size: 1,568 bytes
- **Transport**: TLS 1.3 with HTTP/2 ALPN
- **API**: OAuth 2.0 + JWT with role-based access control

**Security Guardrails**:
- Rate limiting: 1000 req/min per authenticated user
- Certificate pinning for cross-chain communication
- Hardware security modules (HSM) for production keys
- Key rotation: Every 90 days for production

## Troubleshooting

### Common Issues

**Port Conflicts**:
```bash
# Check what's using port 9003 (V11)
lsof -i :9003
kill -9 <PID>

# Check port 3000 (Portal)
lsof -i :3000
```

**Java Version Issues**:
```bash
# V11 requires Java 21
java --version
# Should show: openjdk version "21" or higher

# Set JAVA_HOME (macOS with Homebrew)
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH
```

**Maven Build Failures**:
```bash
# Clean and rebuild (V12)
cd aurigraph-v12/aurigraph-v12-standalone
./mvnw clean
./mvnw clean compile

# Skip tests for quick iteration
./mvnw clean package -DskipTests

# Full build with test coverage
./mvnw clean verify
```

**Docker Native Build Issues**:
```bash
# Ensure Docker is running
docker ps

# Build native V12 with container
./mvnw package -Pnative-fast -Dquarkus.native.container-build=true

# Check Docker resources (native builds need 8GB+ RAM)
docker info | grep Memory

# Verify native executable
./target/aurigraph-v12-standalone-12.0.0-runner --version
```

**Enterprise Portal Connection Issues**:
```bash
# Check V12 API connectivity
curl https://dlt.aurigraph.io/api/v12/health
curl https://dlt.aurigraph.io/api/v12/info

# Check CORS configuration in NGINX
docker-compose logs nginx-gateway | grep CORS

# Test API endpoints
curl https://dlt.aurigraph.io/api/v12/stats | jq .
```

## Important Files - V12 PRIMARY

**Essential Documentation** (V12 BASELINE):
- `/ARCHITECTURE.md` - V12 comprehensive system architecture
- `/DEVELOPMENT.md` - V12 development setup and best practices
- `/CLAUDE.md` - V12 development guidance (THIS FILE)
- `/docs/architecture/` - V12 system design documents
- `/docs/development/` - V12 development guides and tutorials
- `/docs/sdks/` - RWAT SDK documentation and sprint plans
- `/docs/mobile/` - Mobile validator app documentation
- `/docs/website/` - Aurigraph.io website documentation
- `/docs/legal/` - Legal, compliance, and governance documentation
- `/docs/jira/` - JIRA ticket planning and structure
- `/AurigraphDLTVersionHistory.md` - Version history (V12+ focus)

**Core Configuration Files**:
- `/package.json` - Root package configuration (V12 primary)
- `/aurigraph-v12/aurigraph-v12-standalone/pom.xml` - V12 Maven config
- `/start-v12.sh` - V12 quick start script (PRIMARY)
- `/deployment/docker-compose.yml` - V12 production deployment
- `/docker-compose.production.yml` - Multi-service production stack
- `/scripts/` - Development, deployment, and monitoring scripts

**Enterprise Portal**:
- `/enterprise-portal/enterprise-portal/frontend/package.json` - Portal v4.5.0+ dependencies
- `/enterprise-portal/enterprise-portal/frontend/src/` - React components
- `/enterprise-portal/enterprise-portal/frontend/src/api/` - V12 API client

## Development Workflow

### Making Changes to V11

1. **Navigate to V11 directory**:
   ```bash
   cd aurigraph-av10-7/aurigraph-v11-standalone
   ```

2. **Start dev mode** (hot reload enabled):
   ```bash
   ./mvnw quarkus:dev
   ```

3. **Make changes** to Java files in `src/main/java/io/aurigraph/v11/`

4. **Test changes** (automatically reloaded in dev mode):
   ```bash
   curl http://localhost:9003/api/v11/health
   ```

5. **Run tests**:
   ```bash
   ./mvnw test
   ```

6. **Build native image** (for production):
   ```bash
   ./mvnw package -Pnative -Dquarkus.native.container-build=true
   ```

### Making Changes to Enterprise Portal

1. **Navigate to portal directory**:
   ```bash
   cd enterprise-portal/enterprise-portal/frontend
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   # Portal available at http://localhost:3000
   ```

3. **Make changes** to React components in `src/`

4. **Build for production**:
   ```bash
   npm run build
   ```

### Deployment

```bash
# Production deployment (from root)
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Scale validators (if needed)
docker-compose -f docker-compose.production.yml up -d --scale api-node-1=3
```

## Key Architectural Decisions

**Why Java 21 for V11?**
- Virtual threads enable massive concurrency (millions of lightweight threads)
- Strong typing and mature tooling reduce bugs
- GraalVM native compilation for <1s startup and <256MB memory
- Enterprise-grade ecosystem with battle-tested libraries
- Superior performance for high-TPS workloads (2M+ target)

**Why Quarkus?**
- Kubernetes-native framework designed for cloud deployments
- Sub-second startup time with native compilation
- Low memory footprint (<256MB vs 512MB+ for traditional Java)
- Reactive programming support with Mutiny
- Excellent GraalVM integration and developer experience

**Why HyperRAFT++?**
- Proven consensus algorithm (RAFT) with deterministic finality
- Enhanced with parallel log replication for higher throughput
- AI-driven optimization for intelligent transaction ordering
- Byzantine fault tolerance (f < n/3 faulty nodes tolerated)
- <500ms finality with <100ms target

## Related Documentation

- `/ARCHITECTURE.md` - Complete architecture overview with diagrams
- `/DEVELOPMENT.md` - Detailed development setup guide
- `/aurigraph-av10-7/CLAUDE.md` - V11-specific development guidance
- `/aurigraph-av10-7/docs/architecture/` - System design documents
- `/aurigraph-av10-7/docs/development/guides/Agent_Team.md` - Agent framework
- `/enterprise-portal/enterprise-portal/frontend/*.md` - Portal documentation
- https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT - GitHub repository
