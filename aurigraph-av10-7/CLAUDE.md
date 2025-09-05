# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph AV10-7 "Quantum Nexus"** - A quantum-resilient distributed ledger technology platform achieving 1M+ TPS with post-quantum cryptography, zero-knowledge privacy, and cross-chain interoperability across 50+ blockchains.

**Note**: Node.js 20+ required. TypeScript strict mode is enabled with path aliases configured (e.g., `@core/*`, `@consensus/*`).

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

# Deploy to dev4 environment
npm run deploy:dev4

# Validate dev4 deployment
npm run validate:dev4

# Lint and typecheck
npm run lint
npm run typecheck
```

### Testing Commands
```bash
# Run all tests with coverage
npm test

# Run specific test types
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:performance # Performance benchmarks (180s timeout)
npm run test:smoke      # Quick smoke tests
npm run test:security   # Security audit

# Run specific test file
npx jest tests/unit/ai/AutonomousProtocolEvolutionEngine.test.ts --verbose
npx jest <path-to-test> --verbose
```

### Docker & Deployment
```bash
# Full production deployment
docker-compose -f docker-compose.av10-7.yml up -d

# Scale validators for higher throughput (1M+ TPS)
docker-compose -f docker-compose.av10-7.yml up -d --scale av10-validator=10

# Test environment with monitoring
docker-compose -f docker-compose.test.yml up -d

# Dev4 environment
docker-compose -f docker-compose.dev4.yml up -d
```

### Standalone Services
```bash
# Start management dashboard (port 3040)
npx ts-node start-management-dashboard.ts

# Start Vizor monitoring dashboard (port 3052)
npx ts-node start-vizor-dashboard.ts

# Start monitoring API server (port 3001)
npx ts-node src/api/MonitoringAPIServer.ts

# Full UI development (port 3000)
npm run ui:dev
```

## High-Level Architecture

### Core Platform Structure
The platform is organized into specialized modules that work together to achieve 1M+ TPS with quantum security:

```
src/
├── consensus/          # HyperRAFT++ consensus (1M+ TPS achievement)
│   ├── HyperRAFTPlusPlus.ts       # Main consensus algorithm
│   ├── ValidatorOrchestrator.ts    # Network-wide validator coordination
│   ├── ValidatorNode.ts            # Individual validator implementation
│   └── QuantumShardManager.ts      # Quantum-enhanced sharding (parallel universes)
│
├── crypto/            # Post-quantum cryptography (NIST Level 5)
│   ├── QuantumCryptoManager*.ts    # CRYSTALS-Kyber/Dilithium implementation
│   └── NTRUCryptoEngine.ts         # Lattice-based encryption
│
├── ai/               # Autonomous intelligence systems
│   ├── AIOptimizer.ts              # Consensus optimization
│   ├── CollectiveIntelligenceNetwork.ts  # 8-agent collaboration system
│   └── AutonomousProtocolEvolutionEngine.ts # Self-evolving protocols
│
├── crosschain/       # 50+ blockchain interoperability
│   └── CrossChainBridge.ts         # Universal bridge implementation
│
├── rwa/              # Real World Assets framework
│   ├── tokenization/               # Multi-dimensional tokenization
│   ├── compliance/                 # Cross-jurisdiction compliance
│   └── management/                 # Autonomous asset management
│
└── sustainability/   # Regenerative systems
    ├── CarbonNegativeOperationsEngine.ts # Net negative carbon
    └── CircularEconomyEngine.ts          # Waste-to-value conversion
```

### Service Architecture & Dependencies

**Key Data Flows:**
1. **Transaction Flow**: Client → ValidatorNode → HyperRAFT++ consensus → QuantumShardManager (parallel processing) → State commit
2. **Cross-chain Flow**: Source chain → CrossChainBridge → ZK proof generation → Target chain validator → Atomic swap execution
3. **AI Optimization Loop**: VizorDashboard metrics → AIOptimizer analysis → Consensus parameter updates → Performance improvement

**Critical Dependencies:**
- All consensus messages pass through QuantumCryptoManager for NIST Level 5 encryption
- CollectiveIntelligenceNetwork coordinates 8 AI agents for protocol evolution
- VizorDashboard aggregates metrics from all services via Prometheus exporters

## Configuration & Environment

### Core Configuration Files
- **Main Config**: `src/core/ConfigManager.ts` - Central configuration management
- **Network Config**: `config/testnet.json` - Network topology and parameters
- **Dev4 Environment**: `config/dev4/` - Development environment settings
- **Docker Compose**: `docker-compose.*.yml` - Container orchestration

### Key Environment Variables
```bash
# Performance targets
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

## Service Endpoints

### APIs & Dashboards
- **Management API**: http://localhost:3040 (standalone)
- **Monitoring API**: http://localhost:3001
- **Vizor Dashboard**: http://localhost:3052
- **Validator API**: http://localhost:8181
- **Full Node API**: http://localhost:8201
- **Light Node API**: http://localhost:8202
- **UI Development**: http://localhost:3000

### Container Endpoints (when using Docker)
- **Management Dashboard**: http://localhost:3140
- **Validator Node**: http://localhost:8181
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

## Performance & Scaling

### Achieving 1M+ TPS
- **Parallel Processing**: 256 concurrent threads via QuantumShardManager
- **AI Optimization**: TensorFlow.js models in AIOptimizer continuously tune consensus
- **Hardware Requirements**: 32GB+ RAM for dev, 256GB+ for production 1M TPS
- **Network**: 10+ Gbps bandwidth required for full throughput

## Development Workflow

### Agent-Based Development Framework
**IMPORTANT**: All development must follow the agent-based framework defined in [Agent_Team.md](./Agent_Team.md). Key agents include:
- Quantum Security Agent (crypto/)
- Consensus Protocol Agent (consensus/)
- AI Optimization Agent (ai/)
- Cross-Chain Interoperability Agent (crosschain/)
- Monitoring & Observability Agent (monitoring/)

### Testing Requirements
- **Coverage Thresholds**: 95% lines (global), 98% for crypto/, 95% for consensus/
- **Performance Tests**: Must validate 1M+ TPS capability (180s timeout)
- **Test Organization**: Tests in `tests/` directory, setup in `tests/setup.ts`

## Critical Implementation Details

### Quantum Security
- Uses CRYSTALS-Kyber for key encapsulation
- CRYSTALS-Dilithium for digital signatures
- SPHINCS+ for stateless hash-based signatures
- All implementations must maintain NIST Level 5 security

### Consensus Optimization
- HyperRAFT++ achieves consensus in <500ms
- Leader election uses AI prediction
- Automatic failover within 30 seconds
- Byzantine fault tolerance for up to 33% malicious nodes

### Cross-Chain Bridge
- Supports 50+ blockchain networks
- Atomic swap implementation for trustless exchanges
- Bridge validators use quantum-secure multi-sig
- Liquidity pools managed automatically

## Quick Debugging

```bash
# Check service health
curl http://localhost:8181/health

# View validator logs
docker-compose -f docker-compose.av10-7.yml logs -f av10-validator-1

# Common issues:
# - Build fails: Check Node.js 20+
# - Port conflicts: Check 3000-3100, 8000-8300, 9000-9100
# - Docker memory: Need 32GB+ RAM
```

## Related Documentation
- **[Agent_Team.md](./Agent_Team.md)** - Mandatory agent-based development framework
- **[Aurigraph_Infrastructure.md](./Aurigraph_Infrastructure.md)** - Detailed infrastructure and deployment
- **[README.md](./README.md)** - Project overview and quick start
- **Parent CLAUDE.md**: /Users/subbujois/Documents/GitHub/Aurigraph-DLT/CLAUDE.md - MCP configuration and GitHub integration