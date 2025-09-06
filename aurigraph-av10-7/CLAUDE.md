# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph AV10-18 "Quantum Nexus"** - A quantum-resilient distributed ledger technology platform achieving 1M+ TPS with post-quantum cryptography, zero-knowledge privacy, and cross-chain interoperability across 50+ blockchains.

**Technology Stack**: TypeScript, Node.js 20+, Java 24 + Quarkus 3.26.1 + GraalVM (for basicnode)

## Build & Development Commands

### Primary Commands
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start platform (builds first)
npm start

# Development with hot reload
npm run dev

# Lint and typecheck
npm run lint
npm run typecheck
```

### Testing Commands
```bash
# Run all tests with coverage
npm test

# Run specific test types
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:performance # Performance benchmarks (180s timeout)
npm run test:smoke       # Quick smoke tests
npm run test:security    # Security audit

# Run specific test file
npx jest tests/unit/ai/AutonomousProtocolEvolutionEngine.test.ts --verbose
npx jest <path-to-test> --verbose

# Test suite runners
npm run test:quick      # Quick test suite
npm run test:all        # All tests
npm run test:ci         # CI test suite
npm run test:report     # Generate comprehensive report
```

### Deployment Commands
```bash
# Deploy to dev4 environment
npm run deploy:dev4

# Validate dev4 deployment
npm run validate:dev4
npm run dev4  # Alias for validate:dev4

# Docker deployments
docker-compose -f docker-compose.av10-7.yml up -d
docker-compose -f docker-compose.dev4.yml up -d

# Scale validators for 1M+ TPS
docker-compose -f docker-compose.av10-7.yml up -d --scale av10-validator=10
```

### Standalone Services
```bash
# Start management dashboard (port 3040)
npx ts-node start-management-dashboard.ts

# Start Vizor monitoring dashboard (port 3052)
npx ts-node start-vizor-dashboard.ts

# Start monitoring API server (port 3001)
npx ts-node src/api/MonitoringAPIServer.ts

# UI development (port 3000)
npm run ui:dev
```

## High-Level Architecture

### Core Platform Structure
```
src/
├── consensus/          # HyperRAFT++ consensus (1M+ TPS achievement)
│   ├── HyperRAFTPlusPlus.ts        # Main consensus algorithm
│   ├── HyperRAFTPlusPlusV2.ts      # Enhanced version
│   ├── ValidatorOrchestrator.ts    # Network-wide validator coordination
│   ├── ValidatorNode.ts            # Individual validator implementation
│   └── QuantumShardManager.ts      # Quantum-enhanced sharding
│
├── crypto/            # Post-quantum cryptography (NIST Level 5)
│   ├── QuantumCryptoManager.ts     # CRYSTALS-Kyber/Dilithium
│   ├── QuantumCryptoManagerV2.ts   # Enhanced quantum crypto
│   └── NTRUCryptoEngine.ts         # Lattice-based encryption
│
├── ai/               # Autonomous intelligence systems
│   ├── AIOptimizer.ts                           # Consensus optimization
│   ├── CollectiveIntelligenceNetwork.ts        # 8-agent collaboration
│   ├── AutonomousProtocolEvolutionEngine.ts    # Self-evolving protocols
│   └── PredictiveAnalyticsEngine.ts            # ML-driven predictions
│
├── crosschain/       # 50+ blockchain interoperability
│   └── CrossChainBridge.ts         # Universal bridge implementation
│
├── rwa/              # Real World Assets framework
│   ├── tokenization/               # Multi-dimensional tokenization
│   │   ├── CompoundTokenizer.ts
│   │   ├── DigitalTwinTokenizer.ts
│   │   ├── FractionalTokenizer.ts
│   │   └── YieldTokenizer.ts
│   ├── compliance/                 # Cross-jurisdiction compliance
│   ├── management/                 # Autonomous asset management
│   └── mcp/                       # Model Context Protocol integration
│
├── sustainability/   # Regenerative systems
│   ├── CarbonNegativeOperationsEngine.ts
│   └── CircularEconomyEngine.ts
│
└── monitoring/       # Observability & monitoring
    ├── VizorDashboard.ts
    └── PrometheusExporter.ts

basicnode/            # Java-based basic node implementation
├── src/main/java/io/aurigraph/basicnode/
│   ├── BasicNodeApplication.java
│   ├── compliance/                 # AV10-17 compliance
│   └── crypto/                    # Post-quantum crypto
```

### Key Data Flows
1. **Transaction Flow**: Client → ValidatorNode → HyperRAFT++ consensus → QuantumShardManager → State commit
2. **Cross-chain Flow**: Source chain → CrossChainBridge → ZK proof generation → Target chain validator → Atomic swap
3. **AI Optimization Loop**: VizorDashboard metrics → AIOptimizer analysis → Consensus parameter updates

### Critical Dependencies
- All consensus messages encrypted via QuantumCryptoManager (NIST Level 5)
- CollectiveIntelligenceNetwork coordinates 8 AI agents for protocol evolution
- VizorDashboard aggregates metrics from all services via Prometheus

## Service Endpoints

### APIs & Dashboards
- **Management API**: http://localhost:3040
- **Monitoring API**: http://localhost:3001  
- **Vizor Dashboard**: http://localhost:3052
- **Validator API**: http://localhost:8181
- **Full Node API**: http://localhost:8201
- **Light Node API**: http://localhost:8202
- **UI Development**: http://localhost:3000

### Container Endpoints (Docker)
- **Management Dashboard**: http://localhost:3140
- **Validator Node**: http://localhost:8181
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

## Configuration & Environment

### Core Configuration Files
- **Main Config**: `src/core/ConfigManager.ts`
- **Network Config**: `config/testnet.json`
- **Dev4 Environment**: `config/dev4/`
- **TypeScript**: `tsconfig.json` (strict mode, path aliases)
- **Jest Testing**: `jest.config.js`

### Key Environment Variables
```bash
# Performance
TARGET_TPS=1000000
PARALLEL_THREADS=256
QUANTUM_LEVEL=5

# Features
AI_ENABLED=true
ZK_PROOFS_ENABLED=true
CROSS_CHAIN_ENABLED=true

# Monitoring
VIZOR_ENABLED=true
PROMETHEUS_ENABLED=true
```

### TypeScript Path Aliases
The project uses path aliases configured in `tsconfig.json`:
- `@core/*`, `@consensus/*`, `@crypto/*`, `@crosschain/*`, `@ai/*`, etc.

## Testing Requirements
- **Coverage Thresholds**: 
  - Global: 95% lines, 90% functions
  - `crypto/`: 98% lines, 95% functions  
  - `consensus/`: 95% lines, 95% functions
- **Test Setup**: `tests/setup.ts`
- **Test Timeout**: 30s default, 180s for performance tests

## Agent-Based Development (MANDATORY)
All development MUST follow the agent-based framework in [Agent_Team.md](./Agent_Team.md):
- Quantum Security Agent (crypto/)
- Consensus Protocol Agent (consensus/)  
- AI Optimization Agent (ai/)
- Cross-Chain Interoperability Agent (crosschain/)
- Monitoring & Observability Agent (monitoring/)

## Performance & Scaling
- **1M+ TPS**: Via 256 parallel threads in QuantumShardManager
- **Hardware**: 32GB+ RAM for dev, 256GB+ for production
- **Network**: 10+ Gbps bandwidth for full throughput
- **Consensus**: <500ms finality via HyperRAFT++

## GitHub Integration & MCP
The parent directory contains comprehensive MCP (Model Context Protocol) configuration:
- **Config**: `.mcp/config.json` 
- **GitHub Token**: Configured for SUBBUAURIGRAPH
- **JIRA Integration**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV10/boards/657
- See parent [CLAUDE.md](../CLAUDE.md) for detailed MCP setup

## Quick Debugging
```bash
# Check service health
curl http://localhost:8181/health

# View validator logs (Docker)
docker-compose -f docker-compose.av10-7.yml logs -f av10-validator-1

# Common issues:
# - Build fails: Check Node.js 20+
# - Port conflicts: Check 3000-3100, 8000-8300, 9000-9100
# - Docker memory: Need 32GB+ RAM
```

## Related Documentation
- **[Agent_Team.md](./Agent_Team.md)** - Mandatory agent-based development framework
- **[Aurigraph_Infrastructure.md](./Aurigraph_Infrastructure.md)** - Infrastructure and deployment details
- **[README.md](./README.md)** - Project overview and quick start
- **Parent [CLAUDE.md](../CLAUDE.md)** - MCP configuration and GitHub integration