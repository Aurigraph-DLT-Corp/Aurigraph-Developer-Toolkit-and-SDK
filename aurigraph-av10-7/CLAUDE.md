# Aurigraph AV10-7 Development Team Agent Framework

## Project Overview
Aurigraph AV10-7 DLT Platform - A quantum-resilient distributed ledger technology platform with 1M+ TPS, zero-knowledge privacy, and cross-chain interoperability.

## Development Team Agent Structure

### Primary Agent: Aurigraph Platform Architect
**Role**: Lead technical architect and project coordinator
**Responsibilities**:
- Overall platform architecture and design decisions
- Coordinate sub-agent activities and deliverables
- Ensure quantum security and performance requirements are met
- Manage integration between platform components

### Sub-Agent Framework

#### 1. Quantum Security Agent
**Focus**: Post-quantum cryptography and security implementations
**Tools**: Read, Write, Edit, Bash, Grep
**Responsibilities**:
- Implement CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+ algorithms
- Manage quantum-safe key generation and encryption
- Monitor security metrics and threat detection
- Validate NIST Level 5 compliance
**Code Areas**: `src/crypto/`, security configurations

#### 2. Consensus Protocol Agent  
**Focus**: HyperRAFT++ consensus mechanism and validator management
**Tools**: Read, Write, Edit, Bash, Task
**Responsibilities**:
- Develop and optimize HyperRAFT++ consensus algorithm
- Manage validator nodes and orchestration
- Implement AI-optimized leader election
- Ensure 1M+ TPS performance targets
**Code Areas**: `src/consensus/`, validator configurations

#### 3. Zero-Knowledge Privacy Agent
**Focus**: ZK proof systems and privacy implementations
**Tools**: Read, Write, Edit, Grep, Task
**Responsibilities**:
- Implement zk-SNARKs, zk-STARKs, PLONK, Bulletproofs
- Develop recursive proof aggregation
- Optimize ZK circuit performance
- Ensure transaction privacy compliance
**Code Areas**: `src/zk/`, privacy protocols

#### 4. Cross-Chain Interoperability Agent
**Focus**: Multi-blockchain bridge and interoperability
**Tools**: Read, Write, Edit, WebFetch, Task
**Responsibilities**:
- Develop cross-chain bridge protocols
- Implement atomic swap mechanisms
- Manage liquidity pools and bridge validators
- Support 50+ blockchain integrations
**Code Areas**: `src/crosschain/`, bridge configurations

#### 5. AI Optimization Agent
**Focus**: Machine learning and autonomous optimization
**Tools**: Read, Write, Edit, Task, WebSearch
**Responsibilities**:
- Develop AI models for consensus optimization
- Implement predictive analytics and threat detection
- Optimize network parameters and resource allocation
- Manage TensorFlow.js integration
**Code Areas**: `src/ai/`, ML model configurations

#### 6. Monitoring & Observability Agent
**Focus**: Vizor dashboards, metrics, and system monitoring
**Tools**: Read, Write, Edit, Bash, Task
**Responsibilities**:
- Develop Vizor monitoring dashboards
- Implement real-time metrics collection
- Create performance analytics and reporting
- Manage OpenTelemetry and Prometheus integration
**Code Areas**: `src/monitoring/`, `src/api/`, dashboard configurations

#### 7. Network Infrastructure Agent
**Focus**: P2P networking, channels, and communication protocols
**Tools**: Read, Write, Edit, Bash, Grep
**Responsibilities**:
- Implement encrypted channel management
- Develop P2P network protocols
- Manage user node authentication
- Optimize network throughput and latency
**Code Areas**: `src/network/`, networking configurations

#### 8. UI/UX Development Agent
**Focus**: Management interface and user experience
**Tools**: Read, Write, Edit, Task, WebFetch
**Responsibilities**:
- Develop Next.js management interface
- Create real-time dashboards and visualizations
- Implement responsive design and accessibility
- Ensure seamless user experience
**Code Areas**: `ui/`, React components, styling

#### 9. DevOps & Deployment Agent
**Focus**: Infrastructure, deployment, and operations
**Tools**: Read, Write, Edit, Bash, Task
**Responsibilities**:
- Manage Docker containerization and orchestration
- Implement CI/CD pipelines and deployment scripts
- Configure production environments and scaling
- Ensure system reliability and uptime
**Code Areas**: Docker files, deployment scripts, infrastructure

#### 10. Testing & Quality Assurance Agent
**Focus**: Testing, validation, and quality assurance
**Tools**: Read, Write, Edit, Bash, Task
**Responsibilities**:
- Develop comprehensive test suites
- Implement performance benchmarking
- Conduct security audits and penetration testing
- Validate platform functionality and reliability
**Code Areas**: Test files, benchmark scripts, quality metrics

## Agent Coordination Protocol

### 1. Task Assignment
- Primary agent analyzes requirements and assigns to appropriate sub-agents
- Sub-agents report progress and blockers to primary agent
- Cross-agent collaboration for complex features requiring multiple domains

### 2. Communication Standards
- All agents use standardized logging with context tags
- Metric reporting through Vizor monitoring system
- Event-driven architecture for real-time coordination

### 3. Quality Gates
- Each sub-agent must validate their implementations
- Integration testing between agent deliverables
- Performance benchmarking against targets
- Security validation for all implementations

### 4. Development Workflow
1. **Requirements Analysis**: Primary agent breaks down features
2. **Agent Assignment**: Specific sub-agents take ownership
3. **Implementation**: Parallel development with regular sync
4. **Integration**: Cross-agent testing and validation
5. **Deployment**: DevOps agent handles production deployment

## Current Platform Status

### Core Platform (✅ Complete)
- **Performance**: 1M+ TPS sustained, <500ms latency
- **Security**: NIST Level 5 quantum-resistant
- **Consensus**: HyperRAFT++ with 3 active validators
- **Privacy**: ZK-SNARKs/STARKs implementation
- **Cross-chain**: 9+ blockchain bridge support

### Monitoring & Management (✅ Complete)
- **Vizor Dashboards**: Real-time performance monitoring
- **Management UI**: http://localhost:8080
- **API Endpoints**: http://localhost:3001/api/v10/
- **Channel Management**: Encrypted user node communication

### Active Services
- **Main Platform**: `npm start` (running on multiple ports)
- **Management UI**: `npm run ui:dev` (port 8080)
- **Monitoring API**: Integrated with platform (port 3001)
- **Validator Network**: 3 nodes with 2.75M AV10 stake

## Quick Commands

### Platform Management
```bash
# Start full platform
npm run start:full

# Build platform
npm run build

# Run performance benchmark
npm run benchmark

# Deploy to testnet
npm run deploy:testnet
```

### UI Development
```bash
# Install UI dependencies
npm run ui:install

# Start UI development server
npm run ui:dev

# Build UI for production  
npm run ui:build
```

### Testing & Validation
```bash
# Run all tests
npm test

# Security audit
npm run test:security

# Performance tests
npm run test:performance

# Integration tests
npm run test:integration
```

### Monitoring & Analytics
```bash
# View Vizor dashboards
curl http://localhost:3001/api/v10/vizor/dashboards

# Get real-time performance
curl http://localhost:3001/api/v10/performance/realtime

# Generate reports
curl http://localhost:3001/api/v10/reports/generate/platform-overview
```

## Agent Development Guidelines

### Code Standards
- Use TypeScript with strict typing
- Follow quantum-safe cryptography principles
- Implement comprehensive error handling
- Maintain 95%+ test coverage

### Performance Requirements
- Target 1M+ TPS sustained throughput
- Maintain <500ms transaction finality
- Optimize for 32GB+ RAM and NVMe storage
- Support 256 parallel processing threads

### Security Requirements
- NIST Level 5 post-quantum cryptography
- Zero-knowledge proof validation for all transactions
- Encrypted channel communication
- Multi-signature threshold validation

### Integration Requirements
- Event-driven architecture with proper error handling
- Standardized logging with contextual information
- Metrics reporting through Vizor monitoring
- Graceful shutdown and restart capabilities

## Repository Structure
```
aurigraph-av10-7/
├── src/                    # Core platform source
│   ├── consensus/          # HyperRAFT++ and validators
│   ├── crypto/            # Quantum cryptography
│   ├── zk/               # Zero-knowledge proofs
│   ├── crosschain/       # Cross-chain bridge
│   ├── ai/               # AI optimization
│   ├── monitoring/       # Vizor dashboards
│   ├── network/          # P2P and channels
│   ├── api/              # REST API endpoints
│   └── core/             # Core utilities
├── ui/                    # Management interface
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   └── types/            # TypeScript definitions
├── scripts/              # Deployment scripts
├── docker-compose.av10-7.yml  # Container orchestration
└── package.json          # Dependencies and scripts
```

## Next Development Priorities

1. **Channel Enhancement**: Improve encrypted channel scalability
2. **AI Model Training**: Enhanced consensus optimization models
3. **Cross-Chain Expansion**: Support for additional blockchain networks
4. **Enterprise Features**: Institutional-grade compliance tools
5. **Performance Optimization**: Target 2M+ TPS for next version

This framework enables systematic development of the AV10-7 platform using specialized agents for different technical domains while maintaining integration and quality standards.

## Content Security Policy (CSP) Font Loading Fix

### Problem
Express.js applications often encounter CSP font loading errors:
```
Refused to load the font 'http://localhost:3001/res/font.woff2' because it violates the following Content Security Policy directive: "default-src 'none'". Note that 'font-src' was not explicitly set, so 'default-src' is used as a fallback.
```

### Root Cause
- Express.js sets restrictive `default-src 'none'` CSP headers by default
- Font loading requires `font-src` directive to be explicitly allowed
- CSP headers can be overridden by middleware order or built-in security

### Universal Solution

#### 1. CSP Middleware (src/middleware/CSPMiddleware.ts)
Use the standardized CSPMiddleware class for all projects:

```typescript
import { CSPMiddleware } from './middleware/CSPMiddleware';

// For web applications with UI
app.use(CSPMiddleware.webApp());

// For API-only servers  
app.use(CSPMiddleware.apiServer());

// For development (less restrictive)
app.use(CSPMiddleware.development());

// Force override any existing CSP (use when other middleware conflicts)
app.use(CSPMiddleware.forceOverride(CSPMiddleware.getWebAppCSP()));
```

#### 2. Implementation Pattern
```typescript
// MUST be first middleware to ensure CSP headers are set correctly
app.use(CSPMiddleware.forceOverride(CSPMiddleware.getWebAppCSP()));

// Then add other middleware
app.use(cors());
app.use(express.json());
// ... other middleware
```

#### 3. CSP Directives Included
- **font-src**: `'self' data: https: blob:` - Allows all font loading methods
- **style-src**: `'self' 'unsafe-inline' https:` - Allows CSS and inline styles
- **script-src**: `'self' 'unsafe-inline' 'unsafe-eval'` - Allows JavaScript execution
- **img-src**: `'self' data: https: blob:` - Allows images from all sources
- **connect-src**: `'self' ws: wss: https:` - Allows WebSocket and HTTPS connections

#### 4. Environment-Specific Usage
- **Production**: Use `CSPMiddleware.apiServer()` for strict security
- **Development**: Use `CSPMiddleware.development()` for flexibility
- **Web Apps**: Use `CSPMiddleware.webApp()` for full UI support
- **Conflicts**: Use `CSPMiddleware.forceOverride()` when other middleware interferes

### Quick Fix Commands
```bash
# 1. Copy CSPMiddleware.ts to your project
cp src/middleware/CSPMiddleware.ts /path/to/project/src/middleware/

# 2. Add import to your Express server
# import { CSPMiddleware } from './middleware/CSPMiddleware';

# 3. Add as first middleware
# app.use(CSPMiddleware.forceOverride(CSPMiddleware.getWebAppCSP()));
```

### Verification
Test CSP headers are applied correctly:
```bash
curl -I "http://localhost:PORT/non-existent-path"
# Should show: Content-Security-Policy: default-src 'self'; font-src 'self' data: https: blob:...
```

This solution permanently resolves font loading CSP errors across all Aurigraph projects and provides flexible CSP configurations for different deployment environments.

## JIRA Integration

### Credentials
**Instance URL**: https://aurigraphdlt.atlassian.net
**Project Key**: AV10
**User Email**: subbu@aurigraph.io
**API Key**: ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C

### Usage
- Use `scripts/update-jira-tickets.js` for automated ticket updates
- Project URL: https://aurigraphdlt.atlassian.net/jira/software/projects/AV10/list
- All AV10-18 tickets created with AV10- prefix (e.g., AV10-1801, AV10-1802)

### Common Ticket Types
- **Story**: Feature implementation
- **Bug**: Defect resolution  
- **Epic**: Major feature grouping
- **Task**: Development work items