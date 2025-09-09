# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph DLT** - A revolutionary blockchain platform implementing quantum-resistant cryptography, AI-driven consensus, and cross-chain interoperability. The project consists of:
- **V10**: TypeScript/Node.js implementation achieving 1M+ TPS (production-ready)
- **V11**: Java/Quarkus/GraalVM migration for 2M+ TPS (in progress, ~20% complete)

## Essential Commands

### V10 TypeScript Development
```bash
# From aurigraph-av10-7/ directory
npm install                      # Install dependencies
npm run build                    # Build TypeScript to dist/
npm run build:classical          # Build classical version only

# Development & Testing
npm start                        # Start main platform (port 8080)
npm run dev                      # Hot reload development mode
npm run test:unit               # Unit tests with coverage
npm run test:all                # Full test suite via shell script
npm run test:performance        # Performance tests (180s timeout)
npm run lint                    # ESLint check
npm run typecheck               # TypeScript type checking

# Deployment
npm run deploy:dev4             # Deploy to dev4 environment
npm run validate:dev4           # Validate dev4 deployment
docker-compose -f docker-compose.av10-7.yml up -d

# Single test execution
npx jest tests/unit/consensus/HyperRAFTPlusPlus.test.ts --verbose
```

### V11 Java/Quarkus Development
```bash
# From aurigraph-av10-7/aurigraph-v11-standalone/
./mvnw clean package            # Build JAR
./mvnw quarkus:dev             # Dev mode with hot reload (port 9003)
./mvnw test                    # Run all tests
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# Native compilation
./mvnw package -Pnative -Dquarkus.native.container-build=true
./target/aurigraph-v11-standalone-11.0.0-runner  # Run native
```

## High-Level Architecture

### Core Components Architecture

#### V10 TypeScript Structure
```
aurigraph-av10-7/src/
├── consensus/                  # HyperRAFT++ with AI optimization
│   ├── HyperRAFTPlusPlusV2.ts # Main consensus engine (1M+ TPS)
│   └── validators/             # Validator node management
├── crypto/                     # NIST Level 5 quantum-resistant
│   ├── QuantumCrypto.ts       # CRYSTALS-Kyber/Dilithium
│   └── zk/                    # Zero-knowledge proofs
├── ai/                        # AI-driven optimization
│   ├── AIOptimizer.ts         # Performance optimization
│   └── PredictiveConsensus.ts # Predictive transaction ordering
├── crosschain/                # Multi-chain bridge
│   ├── CrossChainBridge.ts   # Universal bridge protocol
│   └── adapters/              # Chain-specific adapters
├── network/                   # P2P networking
│   └── P2PNetwork.ts          # Encrypted channel management
└── monitoring/                # Real-time monitoring
    └── VizorDashboard.ts      # Performance visualization
```

#### V11 Java Migration Structure
```
aurigraph-v11-standalone/src/main/
├── java/io/aurigraph/v11/
│   ├── AurigraphResource.java    # REST endpoints
│   ├── TransactionService.java   # Core transaction processing
│   └── grpc/                      # gRPC service definitions
├── proto/
│   └── aurigraph.proto           # Protocol Buffer definitions
└── resources/
    └── application.properties    # Quarkus configuration
```

### Key Technical Specifications

#### Performance Requirements
- **V10**: 1M+ TPS achieved, <500ms finality
- **V11**: 2M+ TPS target (currently 776K), <100ms finality
- **Parallel Processing**: 256 threads, 5-layer pipeline
- **Batch Size**: 50,000 transactions per batch

#### Security Architecture
- **Quantum Resistance**: CRYSTALS-Kyber/Dilithium (NIST Level 5)
- **Zero-Knowledge**: zk-SNARKs for privacy
- **Consensus**: HyperRAFT++ with AI optimization
- **Network**: TLS 1.3 encrypted channels

#### Cross-Chain Support
- Ethereum, Polygon, BSC, Avalanche, Solana
- Polkadot, Cosmos, NEAR, Algorand
- 21 bridge validators for security

### Configuration & Ports

#### V10 Services
- Main Platform: `http://localhost:8080`
- Management API: `http://localhost:3040`
- Monitoring API: `http://localhost:3001`
- Vizor Dashboard: `http://localhost:3052`
- Validator API: `http://localhost:8181`

#### V11 Services
- REST API: `http://localhost:9003/api/v11/`
- gRPC: `localhost:9004`
- Health: `http://localhost:9003/q/health`
- Metrics: `http://localhost:9003/q/metrics`

### TypeScript Configuration
- **Target**: ES2023, CommonJS modules
- **Strict Mode**: All strict checks enabled
- **Path Aliases**: `@core/*`, `@consensus/*`, `@crypto/*`, etc.
- **Source Maps**: Enabled for debugging

### Testing Strategy

#### Coverage Requirements
- **Global**: 95% line coverage, 90% function coverage
- **Critical Modules**: 
  - `crypto/`: 98% coverage required
  - `consensus/`: 95% coverage required
- **Performance**: Must validate 1M+ TPS

#### Test Categories
- `unit/`: Fast unit tests
- `integration/`: Service integration tests
- `performance/`: TPS and latency validation
- `smoke/`: Quick health checks
- `regression/`: Backward compatibility

### Environment Variables
```bash
# Core Configuration
NODE_ENV=development/production
TARGET_TPS=1000000
PARALLEL_THREADS=256
QUANTUM_LEVEL=5

# AI/ML Settings
AI_ENABLED=true
PREDICTIVE_CONSENSUS=true

# Cross-Chain
CROSS_CHAIN_ENABLED=true
BRIDGE_VALIDATORS=21
```

## Migration Notes (V10 → V11)

### Critical Requirements
1. **100% Java/Quarkus/GraalVM** - No TypeScript in V11
2. **gRPC/Protocol Buffers** - All internal communication
3. **HTTP/2 with TLS 1.3** - Transport layer
4. **Native Compilation** - Required for production
5. **Virtual Threads** - Java 21+ for concurrency

### Current Migration Status
- ✅ Project structure setup
- ✅ Basic REST endpoints
- ✅ Native compilation working
- 🚧 gRPC service implementation (20%)
- 🚧 Performance optimization (776K/2M TPS)
- 📋 Consensus service migration
- 📋 Crypto service migration
- 📋 Full test suite migration

## Debugging Quick Reference

### Common Issues & Solutions

#### V10 TypeScript
```bash
# Build errors - check TypeScript version
npx tsc --version  # Should be 5.3+

# Test failures - run specific test
npx jest path/to/test.ts --verbose --no-coverage

# Port conflicts
lsof -i :8080 && kill -9 <PID>

# Memory issues
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

#### V11 Java/Quarkus
```bash
# Check Java version (requires 21+)
java --version

# Native build failures
docker --version  # Docker required for container builds
./mvnw clean  # Clean before rebuild

# Port 9003 conflict
lsof -i :9003 && kill -9 <PID>

# Performance issues
./mvnw quarkus:dev -Dquarkus.profile=perf
```

## Project Integration Points

### GitHub & JIRA
- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV10/boards/657
- **Branch Pattern**: `feature/aurigraph-v11-*` for V11 work

### Docker & Deployment
- **Dev4 Environment**: AWS-based development cluster
- **Docker Compose**: Multi-validator setup available
- **Native Images**: Built via container for consistency

### CI/CD Scripts
- `scripts/testing/run-test-suite.sh`: Comprehensive test runner
- `scripts/deploy-av10-7.sh`: Deployment automation
- `scripts/performance-test.sh`: Performance validation

## Development Workflow

### For New Features
1. Check existing implementation patterns in `src/`
2. Follow TypeScript strict mode requirements
3. Use established path aliases (`@core/`, `@consensus/`, etc.)
4. Ensure 95%+ test coverage for new code
5. Run `npm run lint` and `npm run typecheck` before commit

### For V11 Migration
1. Port TypeScript logic to Java maintaining exact behavior
2. Use Quarkus reactive patterns (Uni/Multi)
3. Implement gRPC service alongside REST
4. Create comprehensive JUnit tests
5. Validate performance meets or exceeds V10

### For Bug Fixes
1. Add regression test first
2. Fix the issue
3. Validate all existing tests still pass
4. Update documentation if behavior changes