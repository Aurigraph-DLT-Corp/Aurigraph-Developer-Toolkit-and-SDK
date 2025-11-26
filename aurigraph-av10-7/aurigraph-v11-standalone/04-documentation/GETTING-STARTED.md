# Getting Started with Aurigraph V11

**Version**: 11.0.0
**Last Updated**: October 20, 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [First API Call](#first-api-call)
7. [Running Performance Tests](#running-performance-tests)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Next Steps](#next-steps)

---

## Introduction

Welcome to **Aurigraph V11**, a high-performance blockchain platform built on Java/Quarkus/GraalVM. This guide will help you get started with the platform in minutes.

### Key Features

- **Ultra-High Performance**: 2M+ TPS target with <100ms finality
- **Quantum-Resistant**: CRYSTALS-Dilithium/Kyber (NIST Level 5)
- **AI-Optimized**: Machine learning-driven consensus
- **Native Compilation**: Sub-second startup with GraalVM
- **Enterprise-Grade**: Production-ready with comprehensive monitoring

---

## Prerequisites

### System Requirements

- **Java**: JDK 21 or later
- **Maven**: 3.9+ (or use included wrapper `./mvnw`)
- **Docker**: 24.0+ (optional, for native builds)
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk**: 10GB free space

### Required Software

#### Java 21

**macOS**:
```bash
brew install openjdk@21
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
```

**Linux (Ubuntu)**:
```bash
sudo apt update
sudo apt install openjdk-21-jdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

**Verify Installation**:
```bash
java --version
# Expected output: openjdk 21.0.x or later
```

#### Maven (Optional - Using Wrapper)

The project includes Maven Wrapper (`./mvnw`), so Maven installation is optional:

```bash
./mvnw --version
# Maven 3.9.x will be downloaded automatically
```

#### Docker (For Native Builds)

**macOS**:
```bash
brew install --cask docker
```

**Linux**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Verify**:
```bash
docker --version
# Expected: Docker version 24.0 or later
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
```

### 2. Build the Project

**Standard JAR Build**:
```bash
./mvnw clean package
```

This will:
- Compile all Java sources
- Run all tests
- Create executable JAR in `target/quarkus-app/`
- Build time: ~2-3 minutes

**Expected Output**:
```
[INFO] BUILD SUCCESS
[INFO] Total time:  02:15 min
```

### 3. Verify Build

```bash
ls -lh target/quarkus-app/quarkus-run.jar
# Should show JAR file (~50MB)
```

---

## Quick Start

### Development Mode (Recommended for Getting Started)

Development mode provides **hot reload** - changes to Java files are automatically recompiled:

```bash
./mvnw quarkus:dev
```

**Expected Output**:
```
__  ____  __  _____   ___  __ ____  ______
 --/ __ \/ / / / _ | / _ \/ //_/ / / / __/
 -/ /_/ / /_/ / __ |/ , _/ ,< / /_/ /\ \
--\___\_\____/_/ |_/_/|_/_/|_|\____/___/
INFO  [io.quarkus] Aurigraph V11 11.0.0 on JVM (powered by Quarkus 3.26.2) started in 2.145s.
INFO  [io.quarkus] Listening on: http://localhost:9003
```

The platform is now running! Press `Ctrl+C` to stop.

### Production JAR Mode

Run the compiled JAR for production:

```bash
java -jar target/quarkus-app/quarkus-run.jar
```

**Performance**: ~3 second startup

### Native Mode (Advanced)

For **sub-second startup** and **minimal memory footprint**:

```bash
# Build native executable (takes 5-15 minutes)
./mvnw package -Pnative

# Run native executable
./target/aurigraph-v11-standalone-11.0.0-runner
```

**Performance**: <1 second startup, <256MB memory

---

## Configuration

### Port Configuration

Default port is **9003**. To change:

**Edit** `src/main/resources/application.properties`:
```properties
quarkus.http.port=9003
```

Or use environment variable:
```bash
export QUARKUS_HTTP_PORT=8080
./mvnw quarkus:dev
```

### Performance Tuning

**Edit** `src/main/resources/application.properties`:
```properties
# Target TPS (default: 2000000)
aurigraph.performance.target-tps=2000000

# Batch size (default: 10000)
consensus.batch.size=10000

# Parallel threads (default: 256)
consensus.parallel.threads=256

# AI optimization enabled (default: true)
ai.optimization.enabled=true
```

### Database Configuration (Optional)

For persistent storage (by default uses in-memory):

```properties
# PostgreSQL example
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph
quarkus.datasource.password=secure_password
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph
```

---

## First API Call

With the platform running in development mode, test your first API call:

### Health Check

```bash
curl http://localhost:9003/api/v11/health
```

**Expected Response**:
```json
{
  "status": "HEALTHY",
  "version": "11.0.0-standalone",
  "uptimeSeconds": 45,
  "totalRequests": 1,
  "platform": "Java/Quarkus/GraalVM"
}
```

### System Information

```bash
curl http://localhost:9003/api/v11/info
```

**Expected Response**:
```json
{
  "name": "Aurigraph V11 Java Nexus",
  "version": "11.0.0",
  "javaVersion": "Java 21.0.1",
  "framework": "Quarkus Native Ready",
  "osName": "Linux",
  "osArch": "amd64"
}
```

### Process Your First Transaction

```bash
curl -X POST http://localhost:9003/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx_first_test",
    "amount": 100.50
  }'
```

**Expected Response**:
```json
{
  "transactionId": "tx_first_test",
  "status": "PROCESSED",
  "amount": 100.50,
  "timestamp": 1729468745123,
  "message": "Transaction processed successfully"
}
```

---

## Running Performance Tests

### Basic Performance Test

Test transaction processing speed:

```bash
curl "http://localhost:9003/api/v11/performance?iterations=10000&threads=1"
```

**Expected Response**:
```json
{
  "iterations": 10000,
  "durationMs": 5.4,
  "transactionsPerSecond": 1851851.0,
  "nsPerTransaction": 540.0,
  "optimizations": "Java/Quarkus + Virtual Threads",
  "threadCount": 1,
  "targetTPS": 2000000,
  "targetAchieved": false
}
```

### Multi-Threaded Performance Test

Test with parallel processing:

```bash
curl "http://localhost:9003/api/v11/performance?iterations=100000&threads=8"
```

This will process **100,000 transactions** using **8 virtual threads**.

### Ultra-High-Throughput Test

Test maximum throughput with optimized batching:

```bash
curl -X POST http://localhost:9003/api/v11/performance/ultra-throughput \
  -H "Content-Type: application/json" \
  -d '{"iterations": 100000}'
```

**Expected Performance**:
- **Target**: 2M+ TPS
- **Current**: ~1.8M TPS (optimization ongoing)
- **Finality**: <100ms

---

## Monitoring & Health Checks

### Quarkus Health Check

```bash
curl http://localhost:9003/q/health
```

**Response**:
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Aurigraph V11 is running",
      "status": "UP"
    }
  ]
}
```

### Quarkus Metrics (Prometheus)

```bash
curl http://localhost:9003/q/metrics
```

Returns Prometheus-format metrics for monitoring.

### Comprehensive System Status

```bash
curl http://localhost:9003/api/v11/system/status
```

Returns:
- Transaction statistics
- Consensus status
- Crypto status
- Bridge statistics
- AI optimization stats

### Dev UI (Development Mode Only)

When running in dev mode, access the Quarkus Dev UI:

```
http://localhost:9003/q/dev/
```

Features:
- Configuration editor
- Health check dashboard
- Bean discovery
- Test execution
- Metrics visualization

---

## Next Steps

### 1. Explore the API

Review the comprehensive API documentation:
```bash
cat docs/API-DOCUMENTATION.md
```

Or access OpenAPI specification:
```
http://localhost:9003/q/openapi
```

### 2. Run Full Test Suite

```bash
./mvnw test
```

This runs all unit and integration tests.

### 3. Configure AI Optimization

```bash
curl http://localhost:9003/api/v11/ai/status
```

View AI/ML optimization status and models.

### 4. Explore Consensus

```bash
curl http://localhost:9003/api/v11/consensus/status
```

View HyperRAFT++ consensus algorithm status.

### 5. Deploy to Production

For production deployment:

1. **Build native executable**:
   ```bash
   ./mvnw package -Pnative
   ```

2. **Deploy with systemd** (Linux):
   ```bash
   sudo cp target/*-runner /usr/local/bin/aurigraph-v11
   sudo cp deployment/aurigraph-v11.service /etc/systemd/system/
   sudo systemctl enable aurigraph-v11
   sudo systemctl start aurigraph-v11
   ```

3. **Configure NGINX reverse proxy**:
   ```bash
   cd enterprise-portal/nginx/
   ./deploy-nginx.sh --deploy
   ```

### 6. Read Developer Guide

For advanced development topics:
```bash
cat docs/DEVELOPER-GUIDE.md
```

Topics covered:
- Architecture deep dive
- Service development
- Testing strategies
- Performance optimization
- Security best practices
- Deployment strategies

---

## Common Issues & Troubleshooting

### Port Already in Use

If port 9003 is in use:

```bash
# Find process using port
lsof -i :9003

# Kill process
kill -9 <PID>

# Or change port
export QUARKUS_HTTP_PORT=8080
./mvnw quarkus:dev
```

### Out of Memory

If build fails with OutOfMemoryError:

```bash
export MAVEN_OPTS="-Xmx4g -XX:+UseG1GC"
./mvnw clean package
```

### Native Build Fails

Ensure Docker is running:
```bash
docker ps
```

Or build without Docker (requires GraalVM):
```bash
./mvnw package -Pnative -Dquarkus.native.container-build=false
```

### Tests Fail

Run tests with verbose output:
```bash
./mvnw test -X
```

Skip tests during build:
```bash
./mvnw clean package -DskipTests
```

---

## Support & Resources

- **Documentation**: https://docs.aurigraph.io
- **API Reference**: `docs/API-DOCUMENTATION.md`
- **Developer Guide**: `docs/DEVELOPER-GUIDE.md`
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Support Email**: support@aurigraph.io
- **Community**: https://community.aurigraph.io

---

## Quick Reference Card

### Essential Commands

| Command | Description |
|---------|-------------|
| `./mvnw quarkus:dev` | Start development mode (hot reload) |
| `./mvnw clean package` | Build JAR |
| `./mvnw package -Pnative` | Build native executable |
| `./mvnw test` | Run tests |
| `curl localhost:9003/api/v11/health` | Health check |
| `curl localhost:9003/q/dev/` | Dev UI (dev mode) |

### Default Endpoints

| Endpoint | Description |
|----------|-------------|
| `http://localhost:9003/api/v11/health` | Health status |
| `http://localhost:9003/api/v11/info` | System info |
| `http://localhost:9003/q/health` | Quarkus health |
| `http://localhost:9003/q/metrics` | Prometheus metrics |
| `http://localhost:9003/q/dev/` | Dev UI (dev mode only) |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `pom.xml` | Maven project configuration |
| `src/main/resources/application.properties` | Quarkus configuration |
| `src/main/java/io/aurigraph/v11/AurigraphResource.java` | Main REST resource |

---

**Congratulations!** You're now ready to start developing with Aurigraph V11.

For advanced topics, continue to the [Developer Guide](DEVELOPER-GUIDE.md).

---

**Last Updated**: October 20, 2025
**Version**: 11.0.0
**Guide Version**: 1.0.0
