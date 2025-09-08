# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph V11 "Java Nexus"** - Ultra-high-performance blockchain platform built exclusively on Java 24 + Quarkus 3.26.1 + GraalVM 24.0, achieving 15M+ TPS with native compilation, sub-30ms startup, and enterprise-grade architecture.

**MANDATORY ARCHITECTURE**: 
- ALL nodes must use Java/Quarkus/GraalVM ONLY
- ALL communication uses HTTP/2, Protocol Buffers, and gRPC exclusively
- NO TypeScript/Node.js/Python components allowed
- Native compilation required for production deployment

## Build & Development Commands

### Core Development (Java/Quarkus/GraalVM)
```bash
# Maven build commands
mvn clean install              # Build all modules
mvn compile                    # Compile Java sources
mvn package                    # Package JAR files
mvn quarkus:dev               # Development mode with hot reload
mvn test                      # Run all tests
mvn verify                    # Run integration tests

# GraalVM native compilation
mvn package -Pnative          # Build native image
mvn test -Pnative             # Test native image
```

### Testing Suite (Java/JUnit 5)
```bash
# Maven test commands
mvn test                       # All tests with coverage (95% required)
mvn test -Dtest=*UnitTest     # Unit tests only
mvn verify                    # Integration tests
mvn test -Pperformance        # Performance tests (validates 15M+ TPS)
mvn compile -Dquarkus.package.type=native-sources # Security native compilation

# Run specific test
mvn test -Dtest=AurigraphPlatformServiceTest
mvn test -Dtest=TransactionProcessorTest -Dquarkus.test.profile=dev
```

### Deployment Commands (Container-based)
```bash
# Native image container builds
mvn package -Pnative -Dquarkus.container-image.build=true

# Kubernetes deployments
kubectl apply -f k8s/aurigraph-v11/
helm install aurigraph-v11 ./helm/aurigraph-v11/

# Docker deployments (GraalVM native)
docker-compose -f docker-compose.v11.yml up -d

# Scale for 15M+ TPS (all nodes are Java/Quarkus/GraalVM)
kubectl scale deployment aurigraph-validator --replicas=20
kubectl scale deployment aurigraph-full-node --replicas=10
```

### Standalone Services (Java/Quarkus gRPC)
```bash
# All services are Java/Quarkus with gRPC/HTTP/2
mvn quarkus:dev -f aurigraph-platform-service/pom.xml    # Platform gRPC service
mvn quarkus:dev -f aurigraph-validator-node/pom.xml      # Validator node
mvn quarkus:dev -f aurigraph-bridge-node/pom.xml         # Cross-chain bridge
mvn quarkus:dev -f aurigraph-ai-node/pom.xml             # AI orchestration
mvn quarkus:dev -f aurigraph-monitoring-node/pom.xml     # Monitoring/metrics

# gRPC health checks
grpcurl -plaintext localhost:9000 grpc.health.v1.Health/Check
```

### V11 Architecture Validation
```bash
# Java/Quarkus architecture compliance tests
mvn test -Dtest=*ArchitectureTest          # Validate Java-only architecture
mvn verify -Parchitecture-compliance       # Full architecture compliance check
```

## V11 Architecture (Java/Quarkus/GraalVM)

### Core Platform Structure (100% Java)
```
aurigraph-v11/
├── aurigraph-core/                    # Shared Java components
│   ├── Transaction.java               # Immutable transaction records
│   ├── HashUtil.java                  # High-performance hashing
│   └── TransactionType.java           # Optimized enums
├── aurigraph-proto/                   # Protocol Buffer definitions
│   └── aurigraph.proto                # gRPC service definitions
├── aurigraph-platform-service/       # Main gRPC platform service
│   ├── AurigraphPlatformService.java  # gRPC service implementation
│   └── TransactionProcessor.java      # High-speed processing
├── aurigraph-validator-node/          # Java consensus node
├── aurigraph-bridge-node/             # Java cross-chain bridge
├── aurigraph-ai-node/                 # Java AI orchestration
├── aurigraph-quantum-service/         # Java quantum crypto
└── aurigraph-native/                  # GraalVM native compilation
```

### Communication Architecture (Mandatory)
- **Protocol**: gRPC with HTTP/2 multiplexing ONLY
- **Serialization**: Protocol Buffers ONLY
- **Transport**: HTTP/2 with TLS 1.3
- **Service Discovery**: Quarkus service discovery
- **Load Balancing**: gRPC client-side load balancing

### Performance Specifications
- **Target TPS**: 15M+ transactions per second
- **Latency**: <1ms median response time
- **Startup**: <30ms cold start (GraalVM native)
- **Memory**: <64MB heap per service
- **Concurrency**: 1000+ concurrent gRPC streams

### Node Types (All Java/Quarkus/GraalVM)
1. **Validator Nodes**: Consensus and block validation
2. **Full Nodes**: Complete blockchain state management
3. **Light Nodes**: Lightweight client access
4. **Bridge Nodes**: Cross-chain interoperability
5. **AI Nodes**: Machine learning orchestration
6. **Monitoring Nodes**: Metrics and observability
7. **Gateway Nodes**: External API access

### Service Communication Matrix
```
Service            | Protocol | Port | Transport
Platform           | gRPC     | 9000 | HTTP/2 + TLS
Quantum Security   | gRPC     | 9001 | HTTP/2 + TLS  
AI Orchestration   | gRPC     | 9002 | HTTP/2 + TLS
Cross-Chain Bridge | gRPC     | 9003 | HTTP/2 + TLS
RWA Service        | gRPC     | 9004 | HTTP/2 + TLS
```

### Key Data Flows
1. **Transaction Flow**: Client → ValidatorNode → HyperRAFT++ → QuantumShardManager → State commit
2. **Compliance Flow**: Transaction → AV10-24 Framework → Multi-jurisdiction checks → Audit trail
3. **AI Optimization**: Metrics → CollectiveIntelligenceNetwork → Protocol evolution

### Critical Dependencies
- All consensus messages encrypted via QuantumCryptoManager (NIST Level 5)
- AV10-24 AdvancedComplianceFramework enforces multi-jurisdiction regulations
- AV10-32 EnhancedNodeDensityManager optimizes global node distribution

## AV10-24 Advanced Compliance Framework

### Implementation Details
- **Location**: `src/compliance/AV10-24-AdvancedComplianceFramework.ts` (1,391 lines)
- **Test Script**: `test-av10-24-compliance.ts`

### Supported Jurisdictions
- **US**: SEC, FinCEN, CFTC regulations
- **EU**: MiCA, GDPR compliance
- **UK**: FCA regulations
- **JP**: FSA requirements
- **SG**: MAS guidelines
- **CH**: FINMA regulations
- **AE**: DFSA rules
- **HK**: SFC requirements

### Compliance Categories
- KYC/AML with enhanced due diligence
- Data privacy (GDPR/CCPA)
- Securities regulations
- Crypto asset regulations
- Tax compliance
- Environmental compliance
- Consumer protection

### Key Features
- Real-time transaction monitoring
- Automated violation detection
- Risk-based compliance scoring
- Multi-jurisdiction reporting
- Quantum-secured audit trails
- ML-enhanced compliance checks

## Service Endpoints

### Development Services
- Management API: http://localhost:3040
- Monitoring API: http://localhost:3001
- Vizor Dashboard: http://localhost:3052
- Validator API: http://localhost:8181
- Full Node API: http://localhost:8201
- Light Node API: http://localhost:8202
- UI Development: http://localhost:3000

### Docker Container Services
- Management Dashboard: http://localhost:3140
- Validator Node: http://localhost:8181
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## Configuration & Environment

### Core Configuration Files
- `src/core/ConfigManager.ts` - Central configuration
- `config/testnet.json` - Network topology
- `config/dev4/` - Dev4 environment settings
- `tsconfig.json` - TypeScript strict mode with path aliases

### Key Environment Variables
```bash
TARGET_TPS=1000000           # Performance target
PARALLEL_THREADS=256         # Quantum sharding threads
QUANTUM_LEVEL=5             # NIST security level
AI_ENABLED=true             # AI optimization
ZK_PROOFS_ENABLED=true      # Zero-knowledge proofs
CROSS_CHAIN_ENABLED=true    # Multi-chain support
VIZOR_ENABLED=true          # Monitoring dashboard
```

### TypeScript Path Aliases
Configured in `tsconfig.json`:
- `@core/*`, `@consensus/*`, `@crypto/*`, `@compliance/*`, `@ai/*`, etc.

## Testing Requirements
- **Global Coverage**: 95% lines, 90% functions
- **Critical Modules**: 
  - `crypto/`: 98% lines, 95% functions
  - `consensus/`: 95% lines, 95% functions
  - `compliance/`: 95% lines, 90% functions
- **Performance Tests**: 180s timeout, must validate 1M+ TPS
- **Test Setup**: `tests/setup.ts`

## Agent-Based Development Framework

**MANDATORY**: All development follows the agent-based model in [Agent_Team.md](./Agent_Team.md):

1. **Quantum Security Agent** (`crypto/`)
2. **Consensus Protocol Agent** (`consensus/`)
3. **Compliance Agent** (`compliance/`) - Owns AV10-24
4. **AI Optimization Agent** (`ai/`)
5. **Cross-Chain Agent** (`crosschain/`)
6. **Node Density Agent** (`deployment/`) - Owns AV10-32
7. **Monitoring Agent** (`monitoring/`)
8. **Network Infrastructure Agent** (`network/`)
9. **Testing Agent** (`tests/`)
10. **DevOps Agent** (`docker/`, `terraform/`)

## Performance & Hardware Requirements

### Development Environment
- Node.js 20+ (enforced in package.json)
- 32GB+ RAM minimum
- NVMe SSD storage
- 10+ Gbps network for full testing

### Production Requirements (1M+ TPS)
- 256GB+ RAM
- 256 parallel processing threads
- <500ms consensus finality
- 99.99% uptime SLA

## GitHub Integration & MCP

The parent directory contains MCP (Model Context Protocol) configuration:
- **Config**: `.mcp/config.json`
- **GitHub Token**: Configured for SUBBUAURIGRAPH
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV10/boards/657
- See parent [CLAUDE.md](../CLAUDE.md) for MCP details

## Quick Debugging

```bash
# Service health check
curl http://localhost:8181/health

# View Docker logs
docker-compose -f docker-compose.av10-7.yml logs -f av10-validator-1

# Common issues:
# - Node.js version: Requires 20+
# - Port conflicts: Check 3000-3100, 8000-8300, 9000-9100
# - Memory issues: Minimum 32GB RAM required
# - TypeScript errors: Run npm run typecheck
```

## JIRA Ticket Implementation Status

### Completed Features
- **AV10-24**: Advanced Compliance Framework ✅
- **AV10-32**: Enhanced Node Density Manager ✅
- **AV10-8**: Quantum Sharding Manager ✅
- **AV10-16**: Performance Monitoring System ✅

### Implementation Approach
When implementing JIRA tickets:
1. Review ticket requirements in JIRA board
2. Check existing implementation in relevant module
3. Follow agent-based development pattern
4. Ensure 95%+ test coverage
5. Validate performance targets
6. Update this documentation

## Related Documentation
- [Agent_Team.md](./Agent_Team.md) - Agent-based development framework
- [Aurigraph_Infrastructure.md](./Aurigraph_Infrastructure.md) - Infrastructure details
- [README.md](./README.md) - Project overview
- [PRD_V10_UPDATED.md](./PRD_V10_UPDATED.md) - Product requirements
- Parent [CLAUDE.md](../CLAUDE.md) - MCP configuration