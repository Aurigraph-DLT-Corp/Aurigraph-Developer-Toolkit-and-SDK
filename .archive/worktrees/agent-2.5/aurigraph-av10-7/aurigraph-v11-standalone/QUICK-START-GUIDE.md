# Aurigraph V11 Quick Start Guide
**Updated**: October 15, 2025 (Post Proto Compilation Fix)

## Prerequisites

- Java 21+ (OpenJDK recommended)
- Maven 3.8+ (or use included `./mvnw` wrapper)
- Docker (optional, for native builds)
- Redis (optional, for caching)

## Quick Start (Development Mode)

### 1. Start Development Server

```bash
cd aurigraph-v11-standalone
./mvnw quarkus:dev
```

**Expected Output**:
```
Started in 4.2s. Listening on: http://0.0.0.0:9003
Profile dev activated. Live Coding activated.
```

### 2. Verify Server Health

```bash
# REST API Health Check
curl http://localhost:9003/api/v11/health

# Quarkus Health Check
curl http://localhost:9003/q/health

# Expected Response: {"status": "UP" ...}
```

### 3. Access Development Tools

- **Dev UI**: http://localhost:9003/q/dev/
- **Health**: http://localhost:9003/q/health
- **Metrics**: http://localhost:9003/q/metrics
- **OpenAPI**: http://localhost:9003/q/swagger-ui/

## Available Services

### HTTP/REST Endpoints (Port 9003)

- `GET /api/v11/health` - Application health status
- `GET /api/v11/info` - System information
- `GET /api/v11/performance` - Performance test endpoint
- `GET /api/v11/stats` - Transaction statistics

### gRPC Services (Port 9004)

Currently available core services:

1. **AurigraphV11Service**
   - GetHealth, GetSystemInfo
   - SubmitTransaction, GetTransaction
   - GetPerformanceStats, RunPerformanceTest
   - InitiateConsensus

2. **TransactionService**
   - Transaction processing and validation
   - Batch operations

3. **ConsensusService**
   - HyperRAFT++ consensus operations
   - Node management

4. **BlockchainService**
   - Block operations
   - Chain management

5. **CryptoService**
   - Quantum-resistant cryptography
   - Key management

## Common Tasks

### Build Project

```bash
# Clean and compile
./mvnw clean compile

# Package JAR
./mvnw clean package

# Run tests
./mvnw test

# Skip tests (faster build)
./mvnw clean package -DskipTests
```

### Native Compilation

```bash
# Fast native build (development)
./mvnw package -Pnative-fast

# Standard native build
./mvnw package -Pnative

# Ultra-optimized native build (production)
./mvnw package -Pnative-ultra

# Run native executable
./target/aurigraph-v11-standalone-11.3.0-runner
```

### Testing

```bash
# All tests
./mvnw test

# Specific test class
./mvnw test -Dtest=AurigraphResourceTest

# Specific test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# Performance tests
./mvnw test -Pperformance-test
```

## Configuration Profiles

### Development (default)
- HTTP Port: 9003
- gRPC Port: 9004
- Logging: DEBUG
- SSL: Disabled
- Target TPS: 500,000

### Production
```bash
# Run with production profile
./mvnw quarkus:dev -Dquarkus.profile=prod
```
- HTTP Port: 8080 (HTTPS)
- SSL Port: 8443
- Logging: INFO
- SSL: Enabled (TLS 1.3)
- Target TPS: 2,500,000

### V4 Profile (Port 9004)
```bash
# Run with V4 profile
./mvnw quarkus:dev -Dquarkus.profile=v4
```
- HTTP Port: 9004
- gRPC Port: 9005
- Target TPS: 3,000,000

## Known Issues & Workarounds

### Proto Files Temporarily Disabled

Two proto files are currently disabled due to compilation complexity:
- `aurigraph-v11-services.proto.disabled` (advanced services)
- `smart-contracts.proto.disabled` (smart contract operations)

**Workaround**: Core services remain fully functional. Advanced services will be re-enabled in Sprint 1 after proto file restructuring.

**Impact**:
- ❌ Advanced transaction streaming (use core transaction service instead)
- ❌ AI consensus optimization (basic consensus available)
- ❌ Cross-chain bridge services (coming in Sprint 1)
- ❌ Smart contract deployment (coming in Sprint 1)
- ✅ Core transaction processing (fully operational)
- ✅ Basic consensus (fully operational)
- ✅ Blockchain operations (fully operational)

### macOS Epoll Issue

**Issue**: Netty Epoll is Linux-only
**Workaround**: Configured `grpc.use-epoll=false` for macOS development
**Production**: Will use Epoll on Linux for optimal performance

## Performance Testing

### Quick Performance Test

```bash
# Via REST API
curl http://localhost:9003/api/v11/performance

# Via script
./performance-benchmark.sh
```

### Current Performance Metrics

- **Achieved TPS**: ~776,000 (optimization ongoing)
- **Target TPS**: 2,000,000+ (production)
- **Startup Time**: ~4s (JVM), <1s (native)
- **Memory Usage**: ~512MB (JVM), <256MB (native)

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 9003
lsof -i :9003

# Kill process
kill -9 <PID>

# Or change port in application.properties
%dev.quarkus.http.port=9999
```

### Clean Build Issues

```bash
# Full clean
./mvnw clean
rm -rf target/

# Rebuild from scratch
./mvnw clean install -DskipTests
```

### gRPC Not Starting

Check logs for:
- Port conflicts (9004)
- Proto compilation errors
- Network binding issues

```bash
# View full logs
./mvnw quarkus:dev | tee quarkus.log
```

### Java Version Issues

```bash
# Check Java version (requires 21+)
java --version

# Set JAVA_HOME (macOS with Homebrew)
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
```

## Development Workflow

### 1. Start Dev Server with Hot Reload

```bash
./mvnw quarkus:dev
```

**Note**: Changes to Java files are automatically recompiled and reloaded!

### 2. Make Changes

Edit Java files in `src/main/java/io/aurigraph/v11/`

### 3. Test Changes

Dev server automatically reloads - just refresh your API calls!

### 4. Run Tests

```bash
./mvnw test
```

### 5. Check Coverage

```bash
./mvnw verify
open target/site/jacoco/index.html
```

## Useful Commands

```bash
# View running processes
ps aux | grep quarkus

# Monitor logs in real-time
tail -f quarkus.log

# Check Maven dependency tree
./mvnw dependency:tree

# Update Maven wrapper
./mvnw wrapper:wrapper

# Generate OpenAPI spec
curl http://localhost:9003/q/openapi -o openapi.json
```

## Environment Variables

### Required (Production)
```bash
export LEVELDB_MASTER_PASSWORD="your-secure-password"
export BRIDGE_ETH_KEY="your-eth-private-key"
export BRIDGE_SOL_KEY="your-solana-private-key"
```

### Optional (Development)
```bash
export JAVA_OPTS="-Xmx4g -XX:+UseG1GC"
export MAVEN_OPTS="-Xmx2g"
```

## Additional Resources

- **Full Documentation**: See `PROTO-COMPILATION-FIX-REPORT.md`
- **Project Structure**: See `PROJECT_STRUCTURE.md`
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT

## Getting Help

1. Check logs in `target/quarkus.log`
2. Review `PROTO-COMPILATION-FIX-REPORT.md` for known issues
3. Check Quarkus dev UI at http://localhost:9003/q/dev/
4. Review JIRA tickets for related issues

---

**Last Updated**: October 15, 2025
**Version**: 11.3.0
**Status**: Development Ready ✅
