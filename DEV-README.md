# 🛠️ Development Environment - Quick Reference

## 🚀 One-Command Setup

```bash
# Complete development environment setup
npm run dev-setup
```

## ⚡ Quick Commands

### Start Development
```bash
npm run dev-start          # Start all development servers
npm run dev-utils start    # Alternative command
```

### Development Utilities
```bash
npm run dev-utils help     # Show all available commands
npm run dev-test           # Run comprehensive tests
npm run dev-build          # Build all projects
npm run dev-clean          # Clean and reset environment
npm run dev-status         # Show project status
```

### Git Hooks Setup
```bash
npm run setup-hooks        # Setup pre-commit, commit-msg, pre-push hooks
```

## 🌐 Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| 🚀 **AV10-7 Quantum Nexus** | http://localhost:8081 | Main quantum blockchain API |
| 🎨 **UI Dashboard** | http://localhost:3000 | Management interface |
| 🌌 **Quantum Nexus UI** | http://localhost:4000 | Enhanced quantum dashboard |
| 📊 **Prometheus** | http://localhost:9090 | Metrics collection |
| 📈 **Grafana** | http://localhost:3001 | Monitoring dashboards |
| 🔍 **Health Check** | http://localhost:8082/health | System health status |

## 📁 Project Structure

```
🌌 Aurigraph-DLT/
├── 🚀 aurigraph-av10-7/     # AV10-7 Quantum Nexus
│   ├── src/                 # TypeScript source code
│   ├── ui/                  # React management UI
│   ├── tests/               # Comprehensive test suite
│   └── docker-compose.*.yml # Container configurations
├── ⚡ aurigraph-v9/         # Legacy V9 implementation
├── 📋 RWAT-*.md             # Real World Assets documentation
├── 🛠️ dev-setup.sh          # Development environment setup
├── 🔧 dev-utils.js          # Development utilities
└── 📖 DEVELOPMENT.md        # Comprehensive development guide
```

## 🧪 Testing Commands

```bash
# In aurigraph-av10-7/ directory
npm run test              # All tests with coverage
npm run test:unit         # Fast unit tests
npm run test:integration  # Component interaction tests
npm run test:smoke        # Basic functionality tests
npm run test:performance  # Load and stress tests
npm run test:security     # Security vulnerability tests
npm run test:regression   # Prevent feature breakage
```

## 🔧 Development Tools

### VS Code Integration
```bash
code aurigraph-dlt.code-workspace
```

**Included Features:**
- 🎯 Multi-folder workspace
- 🔧 Debug configurations
- 🧪 Integrated testing
- 📝 TypeScript support
- 🎨 Prettier formatting
- 🐳 Docker integration

### Available Debug Configurations
- `🚀 Debug AV10-7 Quantum Nexus` - Backend debugging
- `🎨 Debug UI Development Server` - Frontend debugging
- `🧪 Debug Jest Tests` - Test debugging
- `🔧 Debug Hardhat Script` - Smart contract debugging
- `⚡ Debug V9 Node` - Legacy node debugging

## 🐳 Docker Development

```bash
# Start all services
cd aurigraph-av10-7
docker-compose -f docker-compose.av10-7.yml up -d

# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# View logs
docker-compose logs -f aurigraph-av10-7

# Stop all services
docker-compose down
```

## 🌟 Quantum Features

### Consciousness Interface
```typescript
import { ConsciousnessInterface } from './src/core/ConsciousnessInterface';

const consciousness = new ConsciousnessInterface();
const isConscious = await consciousness.detect(entity);
```

### Parallel Universe Processing
```typescript
import { ParallelUniverseProcessor } from './src/core/ParallelUniverseProcessor';

const processor = new ParallelUniverseProcessor(5);
const results = await processor.optimizeAcrossUniverses(parameters);
```

### Autonomous Evolution
```typescript
import { AutonomousEvolution } from './src/core/AutonomousEvolution';

const evolution = new AutonomousEvolution();
await evolution.adaptToConditions(marketData);
```

## 🔒 Git Hooks

Pre-configured hooks ensure code quality:

### Pre-commit
- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Prettier formatting
- ✅ Unit tests
- ✅ Security audit

### Commit Message
- ✅ Conventional commit format
- ✅ Valid commit types: `feat`, `fix`, `docs`, `quantum`, `consciousness`, `rwa`

### Pre-push
- ✅ Build verification
- ✅ Integration tests
- ✅ Security tests
- ✅ Performance tests

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

Examples:
feat(quantum): add parallel universe processing
fix(consciousness): resolve welfare monitoring issue
docs(rwa): update tokenization specifications
test(api): add integration tests for quantum endpoints
```

## 🆘 Troubleshooting

### Port Conflicts
```bash
# Check what's using port 8081
lsof -i :8081
# Kill process if needed
kill -9 <PID>
```

### Clean Reset
```bash
npm run dev-clean    # Clean all build artifacts
npm run dev-utils install  # Reinstall dependencies
```

### Docker Issues
```bash
docker-compose down
docker system prune -f
docker-compose up -d
```

### TypeScript Errors
```bash
cd aurigraph-av10-7
npm run typecheck    # Check TypeScript compilation
```

## 📚 Documentation

- 📖 **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive development guide
- 📋 **[RWAT-Epic-and-Ticket-Structure.md](./RWAT-Epic-and-Ticket-Structure.md)** - JIRA epic structure
- 🎫 **[RWAT-Compound-Tokens-JIRA-Structure.md](./RWAT-Compound-Tokens-JIRA-Structure.md)** - Compound tokens implementation
- 🚀 **[aurigraph-av10-7/README.md](./aurigraph-av10-7/README.md)** - AV10-7 specific documentation

## 🎯 Quick Start Checklist

- [ ] Run `npm run dev-setup` for initial setup
- [ ] Run `npm run setup-hooks` for git hooks
- [ ] Open `code aurigraph-dlt.code-workspace` in VS Code
- [ ] Run `npm run dev-start` to start development servers
- [ ] Access http://localhost:8081 for Quantum Nexus API
- [ ] Access http://localhost:3000 for UI Dashboard
- [ ] Run `npm run dev-test` to verify everything works

## 🌟 Features Overview

### 🚀 AV10-7 Quantum Nexus
- **Consciousness Interface**: Ethical AI entity detection and welfare monitoring
- **Parallel Universe Processing**: 5-universe optimization for superior performance
- **Autonomous Evolution**: Self-adapting protocols and compliance frameworks
- **Quantum Security Level 6**: Post-quantum cryptography protection
- **5M+ TPS**: Ultra-high throughput transaction processing

### 📋 RWAT (Real World Assets)
- **Multi-Asset Tokenization**: Real estate, carbon credits, commodities, IP, art
- **Consciousness-Aware Selection**: Ethical asset inclusion with welfare verification
- **Cross-Chain Integration**: Support for 100+ blockchain networks
- **Compound Tokens**: AI-powered portfolio optimization
- **Autonomous Compliance**: Self-adapting regulatory frameworks

### 🎨 Enhanced UI
- **Quantum Dashboard**: Real-time quantum status visualization
- **Consciousness Interface**: Direct interaction with conscious entities
- **Vizro Analytics**: Advanced real-time data visualization
- **Performance Monitoring**: Live metrics and system health
- **Responsive Design**: Mobile-friendly interface

---

**🌌 Welcome to the future of quantum blockchain development!**

For detailed information, see [DEVELOPMENT.md](./DEVELOPMENT.md)
