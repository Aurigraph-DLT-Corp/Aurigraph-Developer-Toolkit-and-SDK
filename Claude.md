# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 ENHANCED DEVELOPMENT TEAM AGENTS

**NEW**: Aurigraph now uses an enhanced multi-agent development team for parallel development and deployment. See [AURIGRAPH-TEAM-AGENTS.md](./AURIGRAPH-TEAM-AGENTS.md) for full details.

### Quick Agent Reference

- **CAA (Chief Architect Agent)**: System architecture and strategic decisions
- **BDA (Backend Development Agent)**: Core blockchain platform development
- **FDA (Frontend Development Agent)**: User interfaces and dashboards
- **SCA (Security & Cryptography Agent)**: Security implementation and auditing
- **ADA (AI/ML Development Agent)**: AI-driven optimization and analytics
- **IBA (Integration & Bridge Agent)**: Cross-chain and external integrations
- **QAA (Quality Assurance Agent)**: Testing and quality control
- **DDA (DevOps & Deployment Agent)**: CI/CD and infrastructure management
- **DOA (Documentation Agent)**: Technical documentation and knowledge management
- **PMA (Project Management Agent)**: Sprint planning and task coordination

### Agent Invocation Examples

```bash
# Backend Development
"Invoke BDA to implement HyperRAFT++ consensus"
"Invoke BDA subagent Consensus Specialist for leader election"

# Security Audit
"Invoke SCA to audit quantum cryptography implementation"
"Invoke SCA subagent Penetration Tester for security testing"

# Performance Testing
"Invoke QAA to run 2M TPS load test"
"Invoke QAA subagent Performance Tester for stress testing"

# Deployment
"Invoke DDA to deploy to production"
"Invoke DDA subagent Pipeline Manager for CI/CD optimization"

# AI Optimization
"Invoke ADA to optimize consensus with ML"
"Invoke ADA subagent Anomaly Detector for transaction monitoring"
```

### Parallel Development Workflow

Agents work in parallel across multiple workstreams:

- **Stream 1**: BDA + QAA (Backend development and testing)
- **Stream 2**: FDA + DOA (Frontend and documentation)
- **Stream 3**: SCA + ADA (Security and AI optimization)
- **Stream 4**: IBA + DDA (Integration and deployment)
- **Coordination**: CAA + PMA (Architecture and project management)

## Project Overview

**Aurigraph DLT V11** - High-performance blockchain platform migration from TypeScript (V10) to Java/Quarkus/GraalVM architecture targeting 2M+ TPS with quantum-resistant cryptography and AI-driven consensus.

**Current Migration Status**: ~35% complete

- ✅ Core Java/Quarkus structure
- ✅ REST API and health endpoints
- ✅ Native compilation with optimized profiles
- ✅ AI optimization services (ML-based consensus)
- ✅ Real-world asset tokenization registry (Merkle tree-based)
- ✅ **Enterprise Portal V4.3.2** - React/TypeScript management portal (PRODUCTION)
- ✅ **NGINX Proxy** - Production-ready reverse proxy with security & firewall
- ✅ **Testing Infrastructure** - Sprint 1 complete (140+ tests, 85%+ coverage)
- 🚧 gRPC service implementation
- 🚧 Performance optimization (currently 776K TPS)
- 📋 Full consensus migration from TypeScript

### Enterprise Portal V4.3.2 (NEW)

**Purpose**: Enterprise management portal for Aurigraph V11 blockchain platform
**Status**: ✅ **PRODUCTION** - Live at https://dlt.aurigraph.io
**Technology**: React 18 + TypeScript + Material-UI + Vite
**Testing**: Sprint 1 Complete (140+ tests, 85%+ coverage target)

**Key Features**:
- 23 Pages across 6 categories (Core, Dashboards, Developer, RWA, Security, Settings)
- Real-time blockchain metrics (776K TPS display)
- Node management and monitoring
- Transaction tracking and analytics
- Performance monitoring with ML metrics
- RWA tokenization interface
- Security audit logs
- Settings & configuration management

**Quick Start**:
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open Vitest UI

# Deployment
cd nginx/
./deploy-nginx.sh --test     # Test NGINX config
./deploy-nginx.sh --deploy   # Deploy to production
```

## Essential Commands

### Default: V11 Java/Quarkus Development

```bash
# Quick start V11 (now default)
npm start                        # Starts V11 in dev mode
npm run start:v11:dev           # V11 development with hot reload
npm run start:v11:native        # V11 native executable
npm run start:v10               # Legacy V10 TypeScript platform

# Navigate to V11 standalone project
cd aurigraph-av10-7/aurigraph-v11-standalone/

# Development
./mvnw quarkus:dev              # Hot reload dev mode (port 9003)
./mvnw compile quarkus:dev      # Compile and start dev mode

# Build and Package
./mvnw clean package            # Standard JAR build
./mvnw package -Dquarkus.package.jar.type=uber-jar  # Uber JAR

# Testing
./mvnw test                     # All tests
./mvnw test -Dtest=AurigraphResourceTest  # Specific test
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput  # Specific method

# Native Compilation (3 profiles available)
./mvnw package -Pnative-fast    # Fast development native build
./mvnw package -Pnative         # Standard optimized native build
./mvnw package -Pnative-ultra   # Ultra-optimized production build

# Run native executable
./target/aurigraph-v11-standalone-11.0.0-runner

# Performance testing scripts
./performance-benchmark.sh      # Comprehensive performance test
./run-performance-tests.sh     # JMeter-based load testing

# Quick native build (development)
./quick-native-build.sh        # Uses native-fast profile
```

### V10 TypeScript Development (Legacy Support)

```bash
# From aurigraph-av10-7/ directory
npm install && npm run build   # Install and build
npm start                      # Start V10 platform (port 8080)
npm run test:all              # Full test suite
npm run deploy:dev4           # Deploy to dev4 environment
```

## High-Level Architecture

### V11 Java/Quarkus Architecture (Primary Focus)

```
aurigraph-v11-standalone/
├── src/main/
│   ├── java/io/aurigraph/v11/
│   │   ├── AurigraphResource.java         # REST API endpoints
│   │   ├── TransactionService.java        # Core transaction processing
│   │   ├── ai/                           # AI optimization components
│   │   │   ├── AIOptimizationService.java # ML-based consensus optimization
│   │   │   ├── PredictiveTransactionOrdering.java
│   │   │   └── AnomalyDetectionService.java
│   │   ├── consensus/                    # HyperRAFT++ consensus
│   │   │   ├── HyperRAFTConsensusService.java
│   │   │   └── ConsensusModels.java
│   │   ├── crypto/                       # Quantum-resistant crypto
│   │   │   ├── QuantumCryptoService.java # CRYSTALS-Kyber/Dilithium
│   │   │   └── DilithiumSignatureService.java
│   │   ├── grpc/                        # gRPC services
│   │   │   ├── AurigraphV11GrpcService.java
│   │   │   └── HighPerformanceGrpcService.java
│   │   ├── bridge/                      # Cross-chain bridge
│   │   │   ├── CrossChainBridgeService.java
│   │   │   └── adapters/                # Chain-specific adapters
│   │   ├── registry/                    # Asset registry services
│   │   │   └── RWATRegistryService.java # Real-world asset token registry
│   │   └── merkle/                      # Merkle tree infrastructure
│   │       └── MerkleTreeRegistry.java  # Cryptographic verification
│   ├── proto/
│   │   └── aurigraph-v11.proto          # V11 protocol definitions
│   └── resources/
│       ├── application.properties        # Quarkus configuration
│       └── META-INF/native-image/       # Native compilation configs
└── pom.xml                              # Maven configuration with 3 native profiles
```

### Key Technology Stack

- **Framework**: Quarkus 3.26.2 with reactive programming (Mutiny)
- **Runtime**: Java 21 with Virtual Threads
- **Native**: GraalVM native compilation with 3 optimization profiles
- **Protocol**: gRPC with Protocol Buffers + HTTP/2 REST
- **Testing**: JUnit 5, Mockito, JMeter integration
- **AI/ML**: DeepLearning4J, Apache Commons Math, SMILE ML library
- **Crypto**: BouncyCastle for post-quantum cryptography

## Service Endpoints & Configuration

### V11 Primary Services (Port 9003)

```bash
# REST API endpoints
curl http://localhost:9003/api/v11/health         # Health status
curl http://localhost:9003/api/v11/info           # System information
curl http://localhost:9003/api/v11/performance    # Performance testing
curl http://localhost:9003/api/v11/stats          # Transaction statistics

# Quarkus built-in endpoints
curl http://localhost:9003/q/health               # Quarkus health checks
curl http://localhost:9003/q/metrics              # Prometheus metrics
curl http://localhost:9003/q/dev/                 # Dev UI (dev mode only)

# gRPC service (planned)
grpcurl -plaintext localhost:9004 list            # List gRPC services
```

### Enterprise Portal Production Services (NGINX)

**Production URL**: https://dlt.aurigraph.io
**Backend API**: https://dlt.aurigraph.io/api/v11/*
**NGINX Config**: `enterprise-portal/nginx/`

```bash
# NGINX Management
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal/nginx/

# Test configuration
./deploy-nginx.sh --test

# Deploy to production
./deploy-nginx.sh --deploy

# Check status
./deploy-nginx.sh --status

# Setup SSL (Let's Encrypt)
./deploy-nginx.sh --setup-ssl

# Rollback deployment
./deploy-nginx.sh --rollback

# Firewall setup (first time only)
ssh subbu@dlt.aurigraph.io
sudo ./setup-firewall.sh --setup
```

**NGINX Features**:
- ✅ Reverse proxy for V11 backend (port 9003)
- ✅ Rate limiting: 100 req/s API, 10 req/s admin, 5 req/m auth
- ✅ IP-based firewall for admin endpoints
- ✅ SSL/TLS 1.2/1.3 with modern cipher suites
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Gzip compression & static asset caching (1 year)
- ✅ WebSocket support for real-time updates
- ✅ Automated backup/rollback deployment

### V10 Legacy Services (Reference)

- Main Platform: `http://localhost:8080`
- Management API: `http://localhost:3040`
- Monitoring API: `http://localhost:3001`

## Performance & Requirements

### Current V11 Performance

- **Achieved TPS**: ~776K (optimization ongoing)
- **Target TPS**: 2M+ (production goal)
- **Startup Time**: <1s native, ~3s JVM
- **Memory Usage**: <256MB native, ~512MB JVM
- **Transport**: HTTP/2 with TLS 1.3, gRPC ready

### V11 Native Compilation Profiles

1. **`-Pnative-fast`**: Development builds (~2 min, -O1 optimization)
2. **`-Pnative`**: Standard production (~15 min, optimized)
3. **`-Pnative-ultra`**: Ultra-optimized production (~30 min, -march=native)

## Testing Strategy & Quality Requirements

### V11 Testing Framework

```bash
# Unit tests - JUnit 5 with Mockito
./mvnw test                                    # All tests
./mvnw test -Dtest=AurigraphResourceTest      # Specific class
./mvnw test -Dtest=*Test#testPerformance*     # Pattern matching

# Integration tests with TestContainers
./mvnw test -Dtest=*IT                        # Integration tests only

# Performance tests with JMeter integration
./performance-benchmark.sh                    # Comprehensive benchmark
./run-performance-tests.sh                   # JMeter load tests

# Native image tests
./mvnw test -Dnative                          # Test native executable
```

### Coverage Requirements

**V11 Backend (Java/Quarkus)**:
- **Target Coverage**: 95% line, 90% function
- **Critical Modules**: crypto (98%), consensus (95%), grpc (90%)
- **Current Status**: ~15% coverage (migration in progress)

**Enterprise Portal (React/TypeScript)**:
- **Target Coverage**: 85% line, 85% function, 80% branch
- **Framework**: Vitest 1.6.1 + React Testing Library 14.3.1
- **Current Status**: Sprint 1 Complete ✅
  - Dashboard.test.tsx (30+ tests)
  - Transactions.test.tsx (40+ tests)
  - Performance.test.tsx (30+ tests)
  - Settings.test.tsx (40+ tests)
  - **Total**: 140+ tests implemented
  - **Coverage**: 85%+ for core pages

**Testing Commands (Enterprise Portal)**:
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Run tests
npm test                 # Watch mode
npm run test:run         # Run once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Vitest UI

# View coverage
open coverage/index.html
```

### Environment Configuration

#### V11 Configuration Properties

```bash
# Core settings in application.properties
quarkus.http.port=9003                        # Changed from 9000 due to conflicts
quarkus.grpc.server.port=9004                 # gRPC service port
quarkus.virtual-threads.enabled=true          # Java 21 virtual threads

# Performance tuning
consensus.target.tps=2000000                  # Production TPS target
consensus.batch.size=10000                    # Transaction batch size
consensus.parallel.threads=256                # Processing threads

# AI/ML optimization
ai.optimization.enabled=true                  # Enable ML optimization
ai.optimization.target.tps=3000000           # AI TPS target

# Real-world asset tokenization
rwat.registry.enabled=true                   # Enable RWAT registry
rwat.merkle.enabled=true                     # Enable Merkle tree verification
```

## Migration Status & Critical Requirements

### V11 Migration Requirements

1. **100% Java/Quarkus/GraalVM** - No TypeScript dependencies
2. **gRPC + Protocol Buffers** - All internal service communication
3. **HTTP/2 with TLS 1.3** - High-performance transport layer
4. **Native Compilation** - Sub-second startup required for production
5. **Java 21 Virtual Threads** - Concurrency without OS thread limits

### Component Migration Progress

**Backend (V11 Java/Quarkus)**:
- ✅ Core Quarkus application structure
- ✅ REST API with reactive endpoints (`AurigraphResource.java`)
- ✅ Transaction processing service (`TransactionService.java`)
- ✅ AI optimization framework (ML-based consensus tuning)
- ✅ Native compilation with 3 optimization profiles
- ✅ RWAT registry with Merkle tree cryptographic verification
- 🚧 gRPC service implementation (`HighPerformanceGrpcService.java`)
- 🚧 HyperRAFT++ consensus migration (`HyperRAFTConsensusService.java`)
- 🚧 Performance optimization (776K → 2M+ TPS target)
- 📋 Quantum cryptography service migration
- 📋 Cross-chain bridge service migration
- 📋 Complete test suite migration (currently ~15% coverage)

**Frontend (Enterprise Portal V4.3.2)**:
- ✅ Complete React/TypeScript portal with 23 pages
- ✅ Real-time blockchain metrics integration
- ✅ Material-UI v6 component library
- ✅ Vite build system with hot reload
- ✅ Testing infrastructure (Vitest + RTL)
- ✅ Sprint 1 testing complete (140+ tests, 85%+ coverage)
- ✅ NGINX proxy with security & firewall
- ✅ Production deployment at https://dlt.aurigraph.io
- 🚧 Sprint 2 testing (Main Dashboards)
- 📋 CI/CD pipeline (GitHub Actions)
- 📋 OAuth 2.0 integration with Keycloak
- 📋 E2E testing (Cypress/Playwright)

## Debugging & Troubleshooting

### V11 Java/Quarkus Issues

```bash
# Java version check (requires 21+)
java --version
echo $JAVA_HOME

# Docker for native builds
docker --version
docker info | grep "Server Version"

# Port conflicts
lsof -i :9003 && sudo kill -9 <PID>         # Main HTTP port
lsof -i :9004 && sudo kill -9 <PID>         # gRPC port

# Native build troubleshooting
./validate-native-setup.sh                   # Validate native setup
./mvnw clean                                 # Clean before retry
docker system prune -f                      # Clean Docker cache

# Performance debugging
./mvnw quarkus:dev -Dquarkus.profile=dev    # Debug profile
./mvnw quarkus:dev -Dquarkus.log.category."io.aurigraph".level=DEBUG

# JVM options for development
export MAVEN_OPTS="-Xmx4g -XX:+UseG1GC"
```

### Common V11 Development Patterns

```bash
# Rapid development cycle
./mvnw quarkus:dev                           # Start dev mode (hot reload)
# Make Java changes -> automatic reload
curl localhost:9003/api/v11/health          # Test endpoint

# Performance testing cycle
./mvnw clean package -Pnative-fast          # Quick native build
./target/*-runner                            # Run native
./performance-benchmark.sh                  # Benchmark TPS
```

## Development Workflow & Integration

### V11 Development Workflow

1. **Navigate to V11 project**: `cd aurigraph-av10-7/aurigraph-v11-standalone/`
2. **Start development**: `./mvnw quarkus:dev` (hot reload enabled)
3. **Implement feature**: Follow reactive programming patterns (Uni/Multi)
4. **Add tests**: JUnit 5 with 95% coverage requirement
5. **Validate performance**: Use `/api/v11/performance` endpoint
6. **Build native**: `./mvnw package -Pnative-fast` for quick validation

### V11 Code Patterns

```java
// Reactive endpoint pattern
@GET
@Path("/endpoint")
public Uni<ResponseType> reactiveEndpoint() {
    return Uni.createFrom().item(() -> {
        // Processing logic
        return result;
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}

// gRPC service pattern (when implemented)
@GrpcService
public class MyGrpcService implements MyService {
    public Uni<Response> processRequest(Request request) {
        // Reactive gRPC processing
    }
}
```

### Integration Points

#### GitHub & JIRA

- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **Branch Strategy**: `feature/aurigraph-v11-*` for V11 migration work

#### JIRA API Configuration

**SECURITY WARNING**: Credentials must be loaded from environment variables or secure credential store.

- **JIRA Email**: `${JIRA_EMAIL}` (required)
- **JIRA API Token**: `${JIRA_API_TOKEN}` (required - see doc/Credentials.md)
- **JIRA Base URL**: `https://aurigraphdlt.atlassian.net`
- **Project Key**: `AV11`

**Usage in Scripts:**

```bash
# Load from secure credential store (see doc/Credentials.md)
export JIRA_EMAIL="${JIRA_EMAIL}"
export JIRA_API_TOKEN="${JIRA_API_TOKEN}"
export JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
export JIRA_PROJECT_KEY="AV11"
```

#### Build & Deploy Scripts

Use these scripts for deployment:

**@remote_dev4.sh** - Remote development deployment script
**@deploy_dev4_complete.sh** - Complete dev4 deployment automation
**@docker-compose.yml** - Docker orchestration configuration

**Quick Deploy Command:**

```bash
# Run remote dev4 deployment
./remote_dev4.sh
```

#### Deployment & Infrastructure

- **Dev4 Environment**: AWS-based development cluster
- **Container Strategy**: Docker-based native builds via GraalVM
- **Kubernetes**: Configs in `k8s/` directory with HPA/VPA scaling

#### Performance Validation

- **Local Testing**: `./performance-benchmark.sh` (comprehensive)
- **Load Testing**: `./run-performance-tests.sh` (JMeter integration)
- **Target Metrics**: 2M+ TPS, <1s startup, <256MB memory

#### Remote Server Configuration

**SECURITY WARNING**: Server credentials must be loaded from environment variables or secure credential store.

- **Domain**: dlt.aurigraph.io
- **SSH Access**: `ssh ${REMOTE_USER}@dlt.aurigraph.io` (credentials in doc/Credentials.md)
- **System**: Linux Ubuntu 24.04.3 LTS
- **Resources**: 49Gi RAM, 16 vCPU, 133G disk
- **Docker**: Version 28.4.0
