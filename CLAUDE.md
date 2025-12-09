# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aurigraph DLT** is a high-performance blockchain platform transitioning from TypeScript/Node.js (V10) to Java/Quarkus/GraalVM (V11) architecture. The platform delivers 1M+ TPS currently with a target of 2M+ TPS, featuring quantum-resistant cryptography, HyperRAFT++ consensus, AI optimization, and real-world asset tokenization.

**Current Status (November 2025)**:
- V10 (TypeScript): Production-ready, 1M+ TPS capability
- V11 (Java/Quarkus): 42% migrated, 776K TPS baseline achieved
- Enterprise Portal: v4.5.0 live at https://dlt.aurigraph.io
- Both versions coexist during migration period

## CI/CD Deployment Principles - #MEMORIZED

**CRITICAL RULE: Only deploy changed components. Never reinstall infrastructure on every deployment.**

### Incremental Deployment Strategy
| What Changed | What to Deploy | What to Skip |
|--------------|----------------|--------------|
| Backend code | Rebuild & deploy JAR only | Portal, Infrastructure |
| Portal code | Rebuild & deploy frontend only | Backend, Infrastructure |
| Config files | Reload configuration only | Backend, Portal |
| Infrastructure | Full deployment (rare) | N/A |

### Change Detection
The CI/CD workflow (`remote-deployment.yml`) automatically detects changes:
- `backend_changed`: V11 standalone Java code changes
- `portal_changed`: Enterprise portal React code changes
- `config_changed`: Application configuration changes
- `docker_changed`: Docker-related file changes

### Self-Hosted Runner
- All deployments use self-hosted runner: `aurigraph-prod-runner`
- Labels: `self-hosted`, `Linux`, `X64`, `aurigraph-prod`
- This avoids GitHub Actions budget limits

### Workflow Files
- `remote-deployment.yml` - Main CI/CD with change detection
- `deploy-via-ssh.yml` - Simple SSH-based deployment
- `self-hosted-deploy.yml` - Explicit self-hosted workflow

### Post-Deployment E2E/Smoke Tests - #MEMORIZED
**MANDATORY**: Execute tests after EVERY deployment.

| Test Type | Duration | Tests | Command |
|-----------|----------|-------|---------|
| **Smoke** | ~30s | 3 | `curl -sf https://dlt.aurigraph.io/api/v11/health` |
| **E2E Frontend** | ~3min | 76 | `npx playwright test` |
| **E2E Backend** | ~2min | 75 | `pytest tests/ -v` |

**Quick Smoke Test:**
```bash
curl -sf https://dlt.aurigraph.io/api/v11/health && echo "✅ Health OK"
curl -sf https://dlt.aurigraph.io/api/v11/info && echo "✅ Info OK"
```

**Test Escalation Rule - #MEMORIZED:**
```
Smoke PASS → Done ✅
Smoke FAIL → Run E2E Tests (diagnose specific failures)
E2E FAIL   → Generate report, JIRA, alert, consider rollback
```

## Repository Structure

```
AurigraphDLT/
├── aurigraph-av10-7/              # Main V11 development (Java/Quarkus)
│   ├── aurigraph-v11/             # Multi-module V11 architecture
│   │   ├── aurigraph-core/        # Core blockchain components
│   │   ├── aurigraph-proto/       # Protocol Buffer definitions
│   │   ├── aurigraph-platform-service/  # Main platform service
│   │   └── crosschain-bridge/     # Cross-chain bridge module
│   ├── aurigraph-v11-standalone/  # Standalone V11 service
│   │   └── pom.xml                # Maven config (Quarkus 3.26.2, Java 21)
│   └── docs/                      # Documentation
│       ├── project-av11/          # V11 planning and migration docs
│       ├── architecture/          # System design documents
│       └── development/           # Development guides
├── enterprise-portal/             # React/TypeScript frontend (v4.5.0)
│   └── enterprise-portal/frontend/  # Main portal application
├── deployment/                    # Production deployment configs
│   └── docker-compose.yml         # Multi-service deployment
├── aurigraph-v9/                  # Legacy V9 implementation
├── package.json                   # Root package (Next.js, React)
├── ARCHITECTURE.md                # Comprehensive architecture doc
├── DEVELOPMENT.md                 # Development setup guide
└── start-v11.sh                   # V11 quick start script
```

## Build & Development Commands

### V11 (Java/Quarkus) - Primary Development Target

```bash
# Quick start V11
npm run start:v11              # JVM mode with hot reload
npm run start:v11:dev          # Development mode
npm run start:v11:native       # Native compilation mode

# Direct Maven commands (from aurigraph-av10-7/aurigraph-v11-standalone/)
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev             # Dev mode with hot reload (port 9003)
./mvnw clean package           # Build JAR
./mvnw test                    # Run all tests
./mvnw package -Pnative-fast   # Fast native build (~2 min)
./mvnw package -Pnative        # Standard native build (~15 min)
./mvnw package -Pnative-ultra  # Ultra-optimized build (~30 min)

# Run the built artifact
java -jar target/quarkus-app/quarkus-run.jar
./target/aurigraph-v11-standalone-11.0.0-runner  # Native executable
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

### Technology Stack

**V11 (Java/Quarkus) - Target Architecture**:
- **Runtime**: Java 21 with Virtual Threads
- **Framework**: Quarkus 3.26.2 (reactive, GraalVM-optimized)
- **Build Tool**: Maven 3.9+
- **Communication**: gRPC + Protocol Buffers (planned), REST API (current)
- **Database**: PostgreSQL with Panache, RocksDB for state
- **Reactive**: Mutiny for reactive streams
- **Native**: GraalVM for native compilation
- **Ports**: 9003 (HTTP/2), 9004 (gRPC planned)

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

### Key Components

**V11 Core Services** (`aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/`):
- `AurigraphResource.java` - Main REST API endpoints
- `TransactionService.java` - Transaction processing and validation
- `ai/AIOptimizationService.java` - ML-based optimization (3.0M TPS benchmarks)
- `consensus/HyperRAFTConsensusService.java` - HyperRAFT++ consensus
- `crypto/QuantumCryptoService.java` - NIST Level 5 quantum cryptography
- `bridge/CrossChainBridgeService.java` - Cross-chain interoperability
- `registry/RWATRegistryService.java` - Real-world asset tokenization

**V11 API Endpoints** (Base: https://dlt.aurigraph.io/api/v11):
- `GET /health` - Health check
- `GET /info` - System information
- `GET /stats` - Transaction statistics
- `GET /analytics/dashboard` - Dashboard analytics
- `GET /blockchain/transactions` - Transaction list (paginated)
- `GET /nodes` - Node list
- `GET /consensus/status` - Consensus state
- `POST /contracts/deploy` - Deploy smart contract
- `POST /rwa/tokenize` - Tokenize real-world asset

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

## Performance Benchmarks

### V11 Current Performance (November 2025)
- **TPS Baseline**: 776K (production-verified)
- **TPS with ML Optimization**: 3.0M (Sprint 5 benchmarks, not sustained)
- **Target**: 2M+ sustained TPS
- **Startup**: <1s (native), ~3s (JVM)
- **Memory**: <256MB (native), ~512MB (JVM)
- **Finality**: <500ms current, <100ms target
- **Carbon Footprint**: 0.022 gCO₂/tx (target: <0.17 gCO₂/tx)

### Testing Requirements
- **Unit Test Coverage**: ≥80% mandatory
- **Integration Test Coverage**: ≥70% critical paths
- **E2E Tests**: 100% user flow coverage
- **Performance Tests**: Every release with TPS validation
- **Load Testing**: 24-hour sustained at 150% expected load

## Migration Status

The project is transitioning from TypeScript (V10) to Java/Quarkus (V11):

**Phase 1 - Foundation** ✅ (100% Complete):
- Quarkus project structure
- REST API endpoints
- Basic transaction service
- Health check endpoints
- Native compilation setup
- JWT authentication

**Phase 2 - Core Services** 🚧 (50% Complete):
- HyperRAFT++ consensus (70% - AI optimization pending)
- AI optimization services (90% - online learning pending)
- RWAT registry with Merkle tree (80% - oracle integration partial)
- Native build optimization (complete)
- Enterprise Portal v4.5.0 (complete)
- Quantum crypto (95% - SPHINCS+ integration pending)
- gRPC service layer (Sprint 7 target)
- WebSocket support (in progress)

**Phase 3 - Full Production** 📋 (0% Complete):
- Complete gRPC implementation (Sprint 7-8)
- 2M+ TPS achievement
- Multi-cloud deployment (Azure, GCP)
- Full test suite (95% coverage target)
- Carbon offset integration (Sprint 16-18)
- V10 deprecation timeline

## Configuration

### Environment Variables

**V11 Configuration** (aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties):
```properties
quarkus.http.port=9003
quarkus.http.http2=true
quarkus.native.container-build=true
quarkus.native.builder-image=graalvm
```

**Enterprise Portal**:
```env
API_BASE_URL=https://dlt.aurigraph.io/api/v11
DOMAIN=dlt.aurigraph.io
NODE_ENV=production
```

**IAM Configuration**:
- Server: https://iam2.aurigraph.io/
- Admin User: Awdadmin (development only)
- Realms: AWD (primary), AurCarbonTrace, AurHydroPulse
- Auth: OAuth 2.0 / OpenID Connect

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
# Clean and rebuild
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean
./mvnw clean compile

# Skip tests if needed for quick iteration
./mvnw clean package -DskipTests
```

**Docker Native Build Issues**:
```bash
# Ensure Docker is running
docker ps

# Build with container
./mvnw package -Pnative-fast -Dquarkus.native.container-build=true

# Check Docker resources (native builds need 8GB+ RAM)
docker info | grep Memory
```

**Enterprise Portal Connection Issues**:
```bash
# Check API connectivity
curl https://dlt.aurigraph.io/api/v11/health

# Check CORS configuration in NGINX
docker-compose logs nginx-gateway | grep CORS
```

## Important Files

**Essential Documentation**:
- `/ARCHITECTURE.md` - Comprehensive system architecture (1377 lines)
- `/DEVELOPMENT.md` - Development setup guide
- `/aurigraph-av10-7/CLAUDE.md` - V11-specific development guidance
- `/aurigraph-av10-7/docs/project-av11/` - V11 migration planning
- `/AurigraphDLTVersionHistory.md` - Version history and sprint progress

**Configuration Files**:
- `/package.json` - Root package configuration
- `/aurigraph-av10-7/aurigraph-v11-standalone/pom.xml` - V11 Maven config
- `/start-v11.sh` - V11 quick start script
- `/deployment/docker-compose.yml` - Production deployment
- `/docker-compose.production.yml` - Multi-service production stack

**Enterprise Portal**:
- `/enterprise-portal/enterprise-portal/frontend/package.json` - Portal dependencies
- `/enterprise-portal/enterprise-portal/frontend/src/` - React components

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

## Deployment and Test Agent Roles

### Post-Deployment Testing (MANDATORY)

**IMPORTANT**: Run E2E testing with Playwright and Pytest after EVERY deployment to remote server.

After any deployment to `dlt.aurigraph.io` or other remote servers, execute:

```bash
# 1. Run Playwright E2E Tests (Frontend)
cd enterprise-portal/enterprise-portal/frontend
npx playwright test --reporter=list

# 2. Run Pytest Backend Tests (FastAPI)
cd aurigraph-fastapi
python3 -m pytest tests/ -v --tb=short

# 3. Quick Health Verification
curl -s https://dlt.aurigraph.io/api/v11/health | jq .
curl -s https://dlt.aurigraph.io/api/v11/info | jq .
```

### Test Suite Summary (December 2025)

| Test Type | Framework | Tests | Location |
|-----------|-----------|-------|----------|
| E2E Frontend | Playwright | 76 tests | `enterprise-portal/.../tests/e2e/` |
| Backend API | Pytest | 75 tests | `aurigraph-fastapi/tests/` |
| **Total** | - | **151 tests** | - |

### E2E Test Coverage
- **Navigation**: Homepage, menu, breadcrumbs, search, accessibility (13 tests)
- **Dashboard**: Metrics, charts, loading states, refresh (8 tests)
- **Transactions**: Explorer, search, filters, pagination, details (10 tests)
- **Contracts**: List, forms, status indicators (7 tests)
- **Mobile**: Responsive design on Pixel 5 viewport

### Pytest Test Coverage
- **Health API**: 16 endpoint tests
- **Configuration**: 18 settings validation tests
- **Transaction Models**: 27 model tests
- **Service Mocks**: 14 mock validation tests

### Agent Responsibilities

**Deployment Agent**:
- Execute deployment scripts
- Verify service health
- **Trigger Test Agent after successful deployment**

**Test Agent**:
- Run full E2E test suite (Playwright + Pytest)
- Report test results
- Flag any failures for immediate attention
- Update JIRA with regression test results

### Automated CI/CD Integration

The GitHub Actions workflow `.github/workflows/frontend-deploy.yml` includes:
- Automatic deployment on push to main
- Post-deployment health checks
- NGINX cache clearing

**Future Enhancement**: Integrate Playwright/Pytest into CI/CD pipeline for automated post-deployment testing.

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
