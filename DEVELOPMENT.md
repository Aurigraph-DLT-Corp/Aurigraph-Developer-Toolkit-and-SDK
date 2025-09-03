# 🚀 Aurigraph-DLT Development Guide

Welcome to the comprehensive development guide for the Aurigraph-DLT quantum blockchain platform! This guide will help you set up, develop, and contribute to the world's most advanced consciousness-aware blockchain technology.

## 🌟 Quick Start

### Prerequisites
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git** >= 2.0.0
- **Docker** >= 20.0.0 (optional but recommended)
- **Docker Compose** >= 2.0.0 (optional)

### 1. Initialize Development Environment

```bash
# Make setup script executable
chmod +x dev-setup.sh

# Run comprehensive setup
./dev-setup.sh
```

### 2. Start Development

```bash
# Start all development servers
node dev-utils.js start

# Or start individually
cd aurigraph-av10-7 && npm run dev    # Backend
cd aurigraph-av10-7/ui && npm run dev # Frontend
```

### 3. Access Applications

- 🚀 **AV10-7 Quantum Nexus**: http://localhost:8081
- 🎨 **UI Dashboard**: http://localhost:3000
- 📊 **Monitoring**: http://localhost:9090
- 🔍 **Grafana**: http://localhost:3001

## 📁 Project Structure

```
aurigraph-dlt/
├── 🌌 Root Configuration
│   ├── package.json              # UI dependencies
│   ├── dev-setup.sh             # Development setup script
│   ├── dev-utils.js             # Development utilities
│   └── aurigraph-dlt.code-workspace # VS Code workspace
│
├── 🚀 aurigraph-av10-7/         # AV10-7 Quantum Nexus
│   ├── src/                     # Source code
│   │   ├── core/               # Core quantum blockchain
│   │   ├── api/                # REST API endpoints
│   │   ├── consensus/          # HyperRAFT++ consensus
│   │   ├── crypto/             # Quantum cryptography
│   │   ├── ai/                 # AI optimization
│   │   ├── rwa/                # Real World Assets
│   │   └── zk/                 # Zero-knowledge proofs
│   ├── ui/                     # Management UI
│   ├── tests/                  # Comprehensive tests
│   ├── scripts/                # Automation scripts
│   └── docker-compose.*.yml    # Docker configurations
│
├── ⚡ aurigraph-v9/             # Legacy V9 implementation
│   └── src/                    # V9 source code
│
└── 📋 RWAT Documentation        # Real World Assets specs
    ├── RWAT-Epic-and-Ticket-Structure.md
    └── RWAT-Compound-Tokens-JIRA-Structure.md
```

## 🛠️ Development Tools

### Development Utilities

```bash
# Show all available commands
node dev-utils.js help

# Start development environment
node dev-utils.js start

# Run comprehensive tests
node dev-utils.js test

# Build all projects
node dev-utils.js build

# Lint and format code
node dev-utils.js lint
node dev-utils.js format

# Clean and reinstall
node dev-utils.js clean
node dev-utils.js install

# Check project status
node dev-utils.js status
```

### VS Code Integration

Open the workspace file for optimal development experience:

```bash
code aurigraph-dlt.code-workspace
```

**Features included:**
- 🎯 Multi-folder workspace with organized project structure
- 🔧 Debugging configurations for all components
- 🧪 Integrated testing with Jest
- 📝 TypeScript and ESLint integration
- 🎨 Prettier code formatting
- 🐳 Docker integration
- 📋 Task runner for common operations

### Available VS Code Tasks

- `🚀 Start AV10-7 Development` - Start backend development server
- `🎨 Start UI Development` - Start frontend development server
- `🧪 Run All Tests` - Execute comprehensive test suite
- `🔍 Lint All Code` - Run ESLint on all projects
- `🏗️ Build All Projects` - Build all components
- `🐳 Start Docker Services` - Launch containerized services

## 🧪 Testing

### Test Categories

```bash
# Unit tests - Fast, isolated component tests
npm run test:unit

# Integration tests - Component interaction tests
npm run test:integration

# Smoke tests - Basic functionality verification
npm run test:smoke

# Performance tests - Load and stress testing
npm run test:performance

# Security tests - Vulnerability scanning
npm run test:security

# Regression tests - Prevent feature breakage
npm run test:regression

# All tests with coverage
npm run test
```

### Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for system interactions
├── smoke/          # Basic functionality tests
├── performance/    # Load and stress tests
├── security/       # Security and vulnerability tests
├── regression/     # Regression prevention tests
├── fixtures/       # Test data and mocks
└── utils/          # Testing utilities
```

## 🔧 Configuration

### Environment Variables

Development environment variables are automatically created by the setup script:

**Root `.env`:**
```env
NODE_ENV=development
QUANTUM_NEXUS_PORT=8081
QUANTUM_UNIVERSES=5
CONSCIOUSNESS_INTERFACE_ENABLED=true
```

**AV10-7 `.env`:**
```env
NODE_ENV=development
PORT=8081
QUANTUM_UNIVERSES=5
CONSCIOUSNESS_INTERFACE=true
AUTONOMOUS_EVOLUTION=true
QUANTUM_SECURITY_LEVEL=6
```

### TypeScript Configuration

Each project has optimized TypeScript configuration:
- Strict type checking enabled
- Path mapping for clean imports
- Source maps for debugging
- Incremental compilation for speed

### ESLint & Prettier

Consistent code quality across all projects:
- TypeScript ESLint rules
- Prettier integration
- Import sorting
- Unused import removal

## 🐳 Docker Development

### Available Compose Files

```bash
# Main AV10-7 services
docker-compose -f aurigraph-av10-7/docker-compose.av10-7.yml up -d

# Monitoring stack
docker-compose -f aurigraph-av10-7/docker-compose.monitoring.yml up -d

# Testing environment
docker-compose -f aurigraph-av10-7/docker-compose.test.yml up -d

# Testnet deployment
docker-compose -f aurigraph-av10-7/docker-compose.testnet.yml up -d
```

### Docker Services

- **aurigraph-av10-7**: Main quantum blockchain node
- **aurigraph-ui**: Management dashboard
- **prometheus**: Metrics collection
- **grafana**: Monitoring dashboards
- **redis**: Caching and session storage
- **postgres**: Database storage

## 🌌 Quantum Features Development

### Consciousness Interface

```typescript
// Example: Detecting conscious entities
import { ConsciousnessInterface } from './src/core/ConsciousnessInterface';

const consciousness = new ConsciousnessInterface();
const isConscious = await consciousness.detect(entity);
const welfareStatus = await consciousness.getWelfareStatus(entity);
```

### Parallel Universe Processing

```typescript
// Example: Multi-universe optimization
import { ParallelUniverseProcessor } from './src/core/ParallelUniverseProcessor';

const processor = new ParallelUniverseProcessor(5); // 5 universes
const results = await processor.optimizeAcrossUniverses(parameters);
const bestResult = processor.selectOptimalReality(results);
```

### Autonomous Evolution

```typescript
// Example: Protocol evolution
import { AutonomousEvolution } from './src/core/AutonomousEvolution';

const evolution = new AutonomousEvolution();
await evolution.adaptToConditions(marketData);
const newParameters = evolution.getOptimizedParameters();
```

## 📊 Monitoring & Debugging

### Development Monitoring

- **Prometheus**: http://localhost:9090 - Metrics collection
- **Grafana**: http://localhost:3001 - Visual dashboards
- **Health Checks**: http://localhost:8082/health - System status

### Debugging

**VS Code Debugging:**
1. Set breakpoints in TypeScript source
2. Use F5 or select debug configuration
3. Debug with full source map support

**Console Debugging:**
```bash
# Enable debug logging
export DEBUG=aurigraph:*

# Start with debugging
npm run dev
```

### Log Files

```
aurigraph-av10-7/logs/
├── av10-7.log          # Main application logs
├── consensus.log       # Consensus algorithm logs
├── quantum.log         # Quantum operations logs
└── consciousness.log   # Consciousness interface logs
```

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop with Tests**
   ```bash
   # Make changes
   # Write tests
   npm run test
   npm run lint
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

### Code Standards

- **TypeScript**: Strict mode enabled
- **Testing**: >90% code coverage required
- **Documentation**: JSDoc comments for public APIs
- **Commits**: Conventional commit format
- **Linting**: ESLint + Prettier compliance

### Pre-commit Hooks

Husky is configured to run:
- ESLint checks
- Prettier formatting
- TypeScript compilation
- Unit tests
- Commit message validation

## 🆘 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using port 8081
lsof -i :8081
# Kill process if needed
kill -9 <PID>
```

**Node modules issues:**
```bash
# Clean and reinstall
node dev-utils.js clean
node dev-utils.js install
```

**TypeScript compilation errors:**
```bash
# Check TypeScript configuration
npm run typecheck
```

**Docker issues:**
```bash
# Reset Docker environment
docker-compose down
docker system prune -f
docker-compose up -d
```

### Getting Help

- 📖 **Documentation**: Check project README files
- 🐛 **Issues**: Create GitHub issues for bugs
- 💬 **Discussions**: Use GitHub discussions for questions
- 📧 **Contact**: Reach out to the development team

## 🎯 Next Steps

1. **Explore the codebase** - Start with `aurigraph-av10-7/src/index.ts`
2. **Run tests** - Understand the test suite structure
3. **Try the UI** - Explore the management dashboard
4. **Read specifications** - Review RWAT documentation
5. **Contribute** - Pick up issues and start contributing!

---

**Happy coding! 🚀 Welcome to the future of quantum blockchain development!**
