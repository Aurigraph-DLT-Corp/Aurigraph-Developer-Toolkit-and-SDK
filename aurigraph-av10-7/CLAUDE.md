# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph V11/V11 Hybrid Platform** - A blockchain platform in transition from TypeScript/Node.js (V10) to Java/Quarkus/GraalVM (V11), targeting 2M+ TPS with quantum-resistant security and cross-chain interoperability.

**Current State**: 
- V10 (TypeScript) is the primary implementation with 1M+ TPS capability
- V11 (Java/Quarkus) migration is in progress (~20% complete)
- Both versions coexist during migration period

## Build & Development Commands

### V10 TypeScript/Node.js Commands
```bash
# Install and build
npm install
npm run build

# Development
npm run dev                    # Hot reload development
npm start                      # Start platform (port 8080)
npm run start:classical        # Simplified classical mode

# Testing
npm test                       # All tests with coverage
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests
npm run test:performance      # Performance tests (180s timeout)

# Deployment
npm run deploy:dev4           # Deploy to dev4 environment
npm run validate:dev4         # Validate dev4 deployment

# Docker
docker-compose -f docker-compose.av10-7.yml up -d
docker-compose -f docker-compose.av10-7.yml up -d --scale av10-validator=10
```

### V11 Java/Quarkus Commands
```bash
# Navigate to V11 directory
cd aurigraph-v11-standalone

# Build and run
./mvnw clean package          # Build JAR
./mvnw quarkus:dev           # Dev mode with hot reload
java -jar target/quarkus-app/quarkus-run.jar  # Run JAR (port 9003)

# Native compilation
./mvnw package -Pnative      # Build native image
./target/*-runner            # Run native executable

# Testing
./mvnw test                  # Run all tests
./mvnw test -Dtest=AurigraphResourceTest  # Run specific test
```

## High-Level Architecture

### Dual Architecture During Migration

```
aurigraph-av10-7/                    # Root directory
├── src/                             # V10 TypeScript implementation
│   ├── consensus/                   # HyperRAFT++ consensus
│   ├── crypto/                      # Quantum cryptography
│   ├── ai/                          # AI optimization
│   ├── crosschain/                  # Cross-chain bridge
│   └── rwa/                         # Real-world assets
│
├── aurigraph-v11-standalone/        # V11 Java implementation
│   ├── src/main/java/io/aurigraph/v11/
│   │   ├── AurigraphResource.java  # REST endpoints
│   │   └── TransactionService.java # Transaction processing
│   └── pom.xml                     # Maven configuration
│
└── aurigraph-v11/                   # V11 planning documents
    ├── PROJECT_STRUCTURE.md
    └── JIRA_TICKET_STRUCTURE.md
```

### Key Architecture Components

**V10 TypeScript Stack**:
- **Consensus**: HyperRAFT++ with AI optimization
- **Crypto**: CRYSTALS-Kyber/Dilithium (NIST Level 5)
- **Performance**: 1M+ TPS with 256 parallel threads
- **Network**: P2P with encrypted channels
- **Testing**: Jest with 95% coverage requirement

**V11 Java Stack** (Target):
- **Framework**: Quarkus 3.26.2 with reactive streams
- **Runtime**: GraalVM native compilation
- **Protocol**: gRPC with Protocol Buffers
- **Transport**: HTTP/2 with TLS 1.3
- **Performance**: 2M+ TPS target

### Critical Migration Notes
- V11 must be 100% Java/Quarkus/GraalVM (no TypeScript)
- All internal communication must use gRPC/HTTP2/Protobuf
- Native compilation is required for production
- Current V11 achieves ~776K TPS (optimization ongoing)

## Service Endpoints

### V10 Services
- Management API: http://localhost:3040
- Monitoring API: http://localhost:3001
- Vizor Dashboard: http://localhost:3052
- Validator API: http://localhost:8181

### V11 Services
- REST API: http://localhost:9003/api/v11/
- Health: http://localhost:9003/q/health
- Metrics: http://localhost:9003/q/metrics
- gRPC: localhost:9004 (planned)

## Configuration & Environment

### V10 Configuration
- **Config**: `src/core/ConfigManager.ts`
- **Network**: `config/testnet.json`
- **Dev4**: `config/dev4/`
- **TypeScript**: Strict mode with path aliases (@core/*, @consensus/*)

### V11 Configuration
- **Properties**: `aurigraph-v11-standalone/src/main/resources/application.properties`
- **Port**: 9003 (changed from 9000 due to conflicts)
- **Native**: Container-based build with Docker

### Key Environment Variables
```bash
# V10 Performance
TARGET_TPS=1000000
PARALLEL_THREADS=256
QUANTUM_LEVEL=5

# V11 Configuration
JAVA_HOME=/opt/homebrew/opt/openjdk@21  # macOS
quarkus.http.port=9003
quarkus.native.container-build=true
```

## Testing Requirements

### V10 Testing
- **Coverage**: 95% lines, 90% functions globally
- **Critical modules**: crypto/ (98%), consensus/ (95%)
- **Performance**: Must validate 1M+ TPS
- **Timeout**: 180s for performance tests

### V11 Testing
- **Framework**: JUnit 5 with REST Assured
- **Coverage Target**: 95% (currently ~15%)
- **Performance**: Validates 776K TPS currently

## Agent-Based Development Framework

All development must follow the agent framework in `docs/development/guides/Agent_Team.md`:

1. **Platform Architect**: Overall coordination
2. **Consensus Protocol Agent**: HyperRAFT++ implementation
3. **Quantum Security Agent**: Cryptography (NIST Level 5)
4. **Network Infrastructure Agent**: gRPC/HTTP2 implementation
5. **AI Optimization Agent**: Performance tuning
6. **Cross-Chain Agent**: Bridge implementation
7. **Monitoring Agent**: Vizor dashboard
8. **DevOps Agent**: Container/native builds
9. **Testing Agent**: Test coverage and quality

## Common Development Tasks

### Running a single test (V10)
```bash
npx jest tests/unit/consensus/HyperRAFTPlusPlus.test.ts --verbose
```

### Running a single test (V11)
```bash
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput
```

### Checking TypeScript compilation
```bash
npm run typecheck
```

### Building native image (V11)
```bash
./mvnw package -Pnative -Dquarkus.native.container-build=true
```

## Performance Requirements

### V10 Current Performance
- **TPS**: 1M+ achieved
- **Finality**: <500ms
- **Memory**: 512MB minimum
- **Startup**: ~3s

### V11 Target Performance
- **TPS**: 2M+ (currently 776K)
- **Finality**: <100ms
- **Memory**: <256MB
- **Startup**: <1s (native)

## Migration Status

### Completed
- ✅ V11 project structure
- ✅ Basic REST endpoints
- ✅ Performance testing framework
- ✅ Native compilation setup

### In Progress
- 🚧 gRPC service implementation
- 🚧 Protocol Buffer definitions
- 🚧 Consensus service migration
- 🚧 Performance optimization to 2M+ TPS

### Pending
- 📋 Crypto service migration
- 📋 AI optimization migration
- 📋 Cross-chain bridge migration
- 📋 Full test suite migration

## Quick Debugging

### V10 Issues
```bash
# Check Node version (requires 20+)
node --version

# View logs
docker-compose -f docker-compose.av10-7.yml logs -f av10-validator-1

# Port conflicts
lsof -i :8080  # Main port
lsof -i :3040  # Management
```

### V11 Issues
```bash
# Check Java version (requires 21)
java --version

# View Quarkus logs
./mvnw quarkus:dev

# Port conflicts
lsof -i :9003  # Main port
lsof -i :9004  # gRPC port

# Native build issues
docker --version  # Requires Docker for container builds
```

## Documentation Structure

```
docs/
├── project-av10/           # V10 documentation
├── project-av11/           # V11 migration docs
│   ├── migration/          # TypeScript to Java guides
│   └── jira/              # JIRA ticket structure
├── infrastructure/         # Deployment guides
├── architecture/          # System design
└── development/           # Development guides
    └── testing/           # Test strategies
```

## GitHub & JIRA Integration

- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **Branch Strategy**: feature/AV11-XXX for V11 work
- **Issue Templates**: Available in `.github/ISSUE_TEMPLATE/`

## Related Documentation
- Parent [CLAUDE.md](../CLAUDE.md) - MCP configuration
- [Agent_Team.md](docs/development/guides/Agent_Team.md) - Development framework
- [PROJECT_STRUCTURE.md](aurigraph-v11/PROJECT_STRUCTURE.md) - V11 architecture
- [JIRA_TICKET_STRUCTURE.md](aurigraph-v11/JIRA_TICKET_STRUCTURE.md) - Sprint planning