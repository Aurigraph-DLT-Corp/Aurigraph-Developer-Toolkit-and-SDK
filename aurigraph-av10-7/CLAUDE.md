# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph AV10-7 "Quantum Nexus"** - Revolutionary quantum-resilient DLT platform achieving 1M+ TPS with NIST Level 5 post-quantum cryptography, zero-knowledge privacy, and 50+ blockchain interoperability. Built with TypeScript/Node.js 20+ and Java 24/Quarkus/GraalVM for enterprise-grade blockchain infrastructure.

## Build & Development Commands

### Core Development
```bash
npm install                    # Install dependencies
npm run build                  # Build TypeScript
npm start                      # Start platform (builds first)
npm run dev                    # Development with hot reload
npm run lint                   # ESLint checking
npm run typecheck             # TypeScript type checking
```

### Testing Suite
```bash
npm test                       # All tests with coverage (95% required)
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests
npm run test:performance      # Performance tests (180s timeout, validates 1M+ TPS)
npm run test:security         # Security audit
npm run test:smoke            # Quick smoke tests

# Run specific test
npx jest tests/unit/ai/AutonomousProtocolEvolutionEngine.test.ts --verbose
npx jest <path-to-test> --verbose --no-coverage
```

### Deployment Commands
```bash
# Dev4 environment deployment
npm run deploy:dev4           # Deploy to dev4 environment
npm run validate:dev4         # Validate dev4 deployment
npm run dev4                  # Alias for validate:dev4

# Docker deployments
docker-compose -f docker-compose.av10-7.yml up -d
docker-compose -f docker-compose.dev4.yml up -d

# Scale for 1M+ TPS
docker-compose -f docker-compose.av10-7.yml up -d --scale av10-validator=10
```

### Standalone Services
```bash
npx ts-node start-management-dashboard.ts    # Management API (port 3040)
npx ts-node start-vizor-dashboard.ts        # Vizor monitoring (port 3052)
npx ts-node src/api/MonitoringAPIServer.ts  # Monitoring API (port 3001)
npm run ui:dev                               # UI development (port 3000)
```

### AV10-24 Compliance Testing
```bash
npx ts-node test-av10-24-compliance.ts      # Run comprehensive compliance tests
```

## High-Level Architecture

### Core Platform Structure
```
src/
├── consensus/          # HyperRAFT++ achieving 1M+ TPS
│   ├── HyperRAFTPlusPlus.ts / V2.ts
│   ├── ValidatorOrchestrator.ts
│   ├── ValidatorNode.ts
│   └── QuantumShardManager.ts      # 256 parallel universes
│
├── crypto/            # NIST Level 5 post-quantum security
│   ├── QuantumCryptoManager*.ts    # CRYSTALS-Kyber/Dilithium
│   └── NTRUCryptoEngine.ts
│
├── compliance/        # AV10-24 Advanced Compliance Framework
│   ├── AV10-24-AdvancedComplianceFramework.ts  # Main implementation
│   ├── AdvancedComplianceFramework.ts
│   ├── LegalComplianceModule.ts
│   └── DueDiligenceAutomation.ts
│
├── ai/               # Collective Intelligence Network
│   ├── CollectiveIntelligenceNetwork.ts  # 8-agent system
│   ├── AutonomousProtocolEvolutionEngine.ts
│   └── PredictiveAnalyticsEngine.ts
│
├── deployment/       # AV10-32 Node Density Management
│   ├── AV10-32-EnhancedNodeDensityManager.ts
│   └── OptimalNodeDensityManager.ts
│
├── crosschain/       # 50+ blockchain interoperability
├── rwa/              # Real World Assets tokenization
├── sustainability/   # Carbon-negative operations
└── monitoring/       # Vizor real-time dashboards

basicnode/            # Java 24 + Quarkus + GraalVM
├── src/main/java/io/aurigraph/basicnode/
│   ├── compliance/   # AV10-17 compliance validation
│   └── crypto/       # Post-quantum crypto services
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