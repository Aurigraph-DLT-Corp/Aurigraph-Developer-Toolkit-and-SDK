# Aurigraph V12 Development Guide

Welcome to the Aurigraph V12 development guide. This document provides instructions for setting up, developing, and deploying the high-performance blockchain platform built on Java 21, Quarkus 3.26+, and GraalVM.

## Quick Start

### Prerequisites

**System Requirements:**
- **Java**: OpenJDK 21 or later
- **Maven**: 3.9+ 
- **Git**: 2.0+
- **Docker**: 20.0+ (optional, for native builds)
- **Node.js**: 18+ (for Enterprise Portal development)

**Installation:**
```bash
# macOS (Homebrew)
brew install openjdk@21 maven git

# Ubuntu/Debian
sudo apt-get install openjdk-21-jdk maven git

# Verify installation
java --version  # Should show Java 21+
mvn --version   # Should show Maven 3.9+
```

## Project Structure

```
Aurigraph-DLT/
├── aurigraph-av10-7/                           # V12 Main Development
│   ├── aurigraph-v12-standalone/               # V12 Primary Service
│   │   ├── src/main/java/io/aurigraph/v12/    # V12 Source Code
│   │   │   ├── AurigraphResource.java          # REST API (Port 9003)
│   │   │   ├── TransactionService.java         # Transaction Processing
│   │   │   ├── ai/AIOptimizationService.java   # ML Optimization
│   │   │   ├── consensus/                      # HyperRAFT++ Consensus
│   │   │   ├── crypto/                         # Quantum Cryptography
│   │   │   ├── bridge/                         # Cross-Chain Bridge
│   │   │   ├── registry/                       # RWAT Registry
│   │   │   └── governance/                     # DAO Governance
│   │   ├── src/main/resources/
│   │   │   └── application.properties          # Quarkus Config
│   │   ├── src/test/java/                      # Unit & Integration Tests
│   │   └── pom.xml                             # Maven Configuration
│   ├── aurigraph-v11-standalone/               # V11 Legacy (Support Mode)
│   └── docs/                                   # Documentation
├── enterprise-portal/                           # React Frontend (v4.5.0+)
│   └── enterprise-portal/frontend/
│       ├── src/                                # React Components
│       ├── public/                             # Static Assets
│       └── package.json                        # npm Dependencies
└── deployment/                                  # Production Configs
    └── docker-compose.yml
```

## V12 Development Setup

### 1. Clone Repository

```bash
# Clone the main repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT

# Navigate to V12 directory
cd aurigraph-av10-7/aurigraph-v12-standalone
```

### 2. Build V12

```bash
# Standard build (JVM mode)
./mvnw clean compile

# Build JAR package
./mvnw clean package

# Build with tests
./mvnw clean verify

# Skip tests for quick build
./mvnw clean package -DskipTests
```

### 3. Run V12

**Development Mode (Hot Reload):**
```bash
# From aurigraph-av10-7/aurigraph-v12-standalone/
./mvnw quarkus:dev

# Service starts on http://localhost:9003
# Auto-reloads on file changes
```

**Production Mode (JVM):**
```bash
# Run pre-built JAR
java -jar target/quarkus-app/quarkus-run.jar
```

**Native Mode (Fast Startup):**
```bash
# Build native executable (~15 minutes)
./mvnw package -Pnative -Dquarkus.native.container-build=true

# Run native binary (requires Docker)
./target/aurigraph-v12-standalone-12.0.0-runner
```

## V12 Core Services

### Transaction Processing Service

**Location:** `src/main/java/io/aurigraph/v12/TransactionService.java`

Handles high-throughput transaction processing:
- Validates transactions
- Manages transaction pool
- Processes ~776K+ TPS baseline
- Target: 2M+ TPS sustained

```bash
# Test transaction processing
curl -X POST http://localhost:9003/api/v12/transactions \
  -H "Content-Type: application/json" \
  -d '{"sender":"0x...", "receiver":"0x...", "amount":100}'
```

### HyperRAFT++ Consensus

**Location:** `src/main/java/io/aurigraph/v12/consensus/`

Implements the consensus algorithm:
- Leader election with adaptive timeouts (150-300ms)
- Parallel log replication
- Byzantine fault tolerance (f < n/3)
- AI-driven optimization

```bash
# Check consensus status
curl http://localhost:9003/api/v12/consensus/status
```

### AI Optimization Service

**Location:** `src/main/java/io/aurigraph/v12/ai/`

Machine learning optimization for transaction ordering:
- Neural network training on historical data
- Real-time performance prediction
- Dynamic parameter tuning
- 3M+ TPS achieved in benchmarks

### Quantum-Resistant Cryptography

**Location:** `src/main/java/io/aurigraph/v12/crypto/`

NIST Level 5 quantum-resistant implementation:
- CRYSTALS-Dilithium for digital signatures
- CRYSTALS-Kyber for encryption
- Hardware acceleration support
- Automatic key rotation (90-day cycle)

### Real-World Asset Tokenization (RWAT)

**Location:** `src/main/java/io/aurigraph/v12/registry/`

Merkle tree-based asset registry:
- Asset registration and verification
- Fractional ownership tracking
- Oracle-based valuation updates
- Proof-of-ownership verification

### DAO Governance

**Location:** `src/main/java/io/aurigraph/v12/governance/`

Decentralized governance system:
- Token voting (AUR token, 1B supply)
- Proposal submission and voting
- Timelock mechanisms
- Emergency pause procedures

## Testing

### Unit Tests

```bash
# Run all unit tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=TransactionServiceTest

# Run specific test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# Generate coverage report
./mvnw verify
# Report: target/site/jacoco/index.html
```

### Integration Tests

```bash
# Integration test suite
./mvnw verify -P integration

# Tests include:
# - Multi-node consensus
# - Cross-chain bridge functionality
# - RWAT registry operations
# - Governance voting procedures
```

### Performance Tests

```bash
# Load testing (50K+ TPS)
./mvnw test -Dtest=PerformanceBenchmarkTest

# Stress testing (target throughput)
./mvnw test -Dtest=StressBenchmarkTest
```

## Configuration

### application.properties

**Location:** `src/main/resources/application.properties`

Key V12 Configuration:
```properties
# HTTP/2 Configuration
quarkus.http.port=9003
quarkus.http.http2=true
quarkus.http.cors=true

# Native Image Configuration
quarkus.native.container-build=true
quarkus.native.builder-image=graalvm

# Database Configuration
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph
quarkus.datasource.password=secure_password

# Reactive Configuration
quarkus.reactor.netty.log-handler-supplier=custom
```

### Environment Variables

**Development (.env):**
```bash
# Server Configuration
QUARKUS_HTTP_PORT=9003
QUARKUS_HTTP_HTTP2=true

# Database
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://localhost:5432/aurigraph
QUARKUS_DATASOURCE_USERNAME=aurigraph
QUARKUS_DATASOURCE_PASSWORD=dev_password

# Redis Cache
QUARKUS_REDIS_HOSTS=localhost:6379

# JWT/OAuth
AUTH_JWT_SECRET=dev_jwt_secret_key
KEYCLOAK_URL=https://iam2.aurigraph.io/auth

# Validator Configuration
VALIDATOR_STAKE=10000
VALIDATOR_ID=v1-dev
```

## Enterprise Portal Development

**Location:** `enterprise-portal/enterprise-portal/frontend/`

### Setup Portal

```bash
# Navigate to portal directory
cd enterprise-portal/enterprise-portal/frontend

# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Build for production
npm run build

# Production server
npm start
```

### Portal Features

- Transaction monitoring dashboard
- Validator node management
- Governance proposal voting
- Real-world asset visualization
- Cross-chain bridge status
- Analytics and performance metrics

## Docker Development

### V12 Containerization

```bash
# Build Docker image
docker build -t aurigraph-v12:latest \
  -f src/main/docker/Dockerfile.native .

# Run container
docker run -p 9003:9003 \
  -e QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/aurigraph \
  aurigraph-v12:latest
```

### Docker Compose Setup

```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# Services:
# - PostgreSQL 16 (localhost:5432)
# - Redis 7 (localhost:6379)
# - Aurigraph V12 (localhost:9003)
# - NGINX Gateway (localhost:443)
# - Keycloak IAM (localhost:8180)
# - Prometheus (localhost:9090)
# - Grafana (localhost:3001)
```

## Debugging

### VS Code Java Debug

**Launch Configuration (.vscode/launch.json):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Quarkus Dev Mode",
      "request": "launch",
      "mainClass": "io.quarkus.dev.runner.Main",
      "args": "quarkus:dev",
      "console": "integratedTerminal"
    }
  ]
}
```

### Remote Debugging

```bash
# Run with remote debugging enabled
./mvnw quarkus:dev -Ddebug=5005

# Connect debugger to localhost:5005
```

### Health Checks

```bash
# Liveness probe
curl http://localhost:9003/q/health/live

# Readiness probe
curl http://localhost:9003/q/health/ready

# Metrics endpoint
curl http://localhost:9003/q/metrics
```

## Performance Optimization

### Virtual Threads (Java 21)

V12 leverages Java 21 Virtual Threads for massive concurrency:
- Enables millions of lightweight concurrent tasks
- Improves throughput for I/O-bound operations
- Reduces memory overhead compared to platform threads

### Native Image Optimization

```bash
# Fast native build (development)
./mvnw package -Pnative-fast \
  -Dquarkus.native.container-build=true

# Standard native build (production)
./mvnw package -Pnative \
  -Dquarkus.native.container-build=true

# Ultra-optimized native build
./mvnw package -Pnative-ultra \
  -Dquarkus.native.container-build=true
```

### Profiling

```bash
# CPU Profiling
java -XX:+UnlockDiagnosticVMOptions \
  -XX:+DebugNonSafepoints \
  -jar target/quarkus-app/quarkus-run.jar

# Memory Analysis
jmap -dump:live,format=b,file=heap.bin pid
jhat -J-Xmx2g heap.bin
```

## Troubleshooting

### Common Issues

**Java Version Mismatch:**
```bash
# Check installed Java versions
java --version

# Set JAVA_HOME for V12
export JAVA_HOME=/path/to/java-21
export PATH=$JAVA_HOME/bin:$PATH
```

**Maven Build Failures:**
```bash
# Clean Maven cache
./mvnw clean

# Update Maven dependencies
./mvnw dependency:resolve-plugins

# Rebuild
./mvnw clean compile
```

**Port Conflicts:**
```bash
# Check what's using port 9003
lsof -i :9003

# Kill process if needed
kill -9 <PID>
```

**Docker Native Build Issues:**
```bash
# Ensure Docker is running
docker ps

# Check available Docker resources
docker info | grep Memory

# Build with container (requires 8GB+ RAM)
./mvnw package -Pnative-fast \
  -Dquarkus.native.container-build=true
```

## Deployment

### Local Testing

```bash
# Start all services locally
docker-compose -f deployment/docker-compose.yml up -d

# Run smoke tests
./mvnw verify -P smoke-tests

# Access services
# V12 API: http://localhost:9003
# Portal: http://localhost:3000
# Grafana: http://localhost:3001
```

### Production Deployment

See `/deployment/docker-compose.production.yml` for multi-cloud deployment configuration across AWS, Azure, and GCP.

## Contributing

### Development Workflow

1. **Create feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: description of feature"
   ```

3. **Push and create pull request**
   ```bash
   git push origin feature/your-feature
   ```

4. **Ensure tests pass**
   ```bash
   ./mvnw verify
   ```

### Code Standards

- **Java Style**: Follow Google Java Style Guide
- **Test Coverage**: >80% for new code
- **Documentation**: JavaDoc for public APIs
- **Commits**: Conventional Commit format
- **Linting**: Checkstyle validation

## Resources

- 📖 [ARCHITECTURE.md](/ARCHITECTURE.md) - System architecture
- 📋 [CLAUDE.md](/CLAUDE.md) - Development guidance
- 🔗 [GitHub Repository](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT)
- 🎯 [RWAT SDK Documentation](/docs/sdks/)
- 📱 [Mobile Node Documentation](/docs/mobile/)

---

**Version**: 12.0.0  
**Last Updated**: December 2025  
**Platform**: V12 (Java 21/Quarkus/GraalVM)
