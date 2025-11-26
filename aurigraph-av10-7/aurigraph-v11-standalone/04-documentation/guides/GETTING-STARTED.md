# Getting Started with Aurigraph V11

Welcome to Aurigraph V11 - a high-performance blockchain platform built with Java 21, Quarkus, and GraalVM.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Your First Transaction](#your-first-transaction)
- [Exploring the API](#exploring-the-api)
- [Common Use Cases](#common-use-cases)
- [Next Steps](#next-steps)

## Prerequisites

### System Requirements

- **Java**: JDK 21+ (OpenJDK or GraalVM)
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Disk**: 10GB available space
- **OS**: Linux, macOS, or Windows with WSL2
- **Optional**: Docker (for containerized deployment)

### Installation

#### 1. Install Java 21

**macOS (Homebrew):**
```bash
brew install openjdk@21
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-21-jdk
```

**Verify installation:**
```bash
java --version
# Should show: openjdk 21.x.x
```

#### 2. Install Maven (if not using wrapper)

**macOS:**
```bash
brew install maven
```

**Linux:**
```bash
sudo apt install maven
```

#### 3. Clone the Repository

```bash
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
```

## Quick Start

### Option 1: Development Mode (Hot Reload)

```bash
# Start in development mode with hot reload
./mvnw quarkus:dev
```

This starts the server at `http://localhost:9003` with:
- Automatic code reload on changes
- Dev UI at `http://localhost:9003/q/dev`
- Swagger UI at `http://localhost:9003/q/swagger-ui`

### Option 2: Package and Run (JVM)

```bash
# Build the application
./mvnw clean package

# Run the JAR
java -jar target/quarkus-app/quarkus-run.jar
```

### Option 3: Native Executable (Production)

```bash
# Build native executable (requires GraalVM)
./mvnw package -Pnative-fast

# Run the native executable
./target/aurigraph-v11-standalone-11.0.0-runner
```

**Native startup time**: < 1 second
**Memory footprint**: < 256MB

### Verify Installation

```bash
# Check health
curl http://localhost:9003/api/v11/health

# Expected response:
# {
#   "status": "HEALTHY",
#   "version": "11.0.0-standalone",
#   "uptimeSeconds": 10,
#   "totalRequests": 1,
#   "platform": "Java/Quarkus/GraalVM"
# }
```

## Your First Transaction

### 1. Check System Status

```bash
curl http://localhost:9003/api/v11/info
```

**Response:**
```json
{
  "name": "Aurigraph V11 Java Nexus",
  "version": "11.0.0",
  "javaVersion": "Java 21.0.1",
  "framework": "Quarkus Native Ready",
  "osName": "Mac OS X",
  "osArch": "aarch64"
}
```

### 2. Process a Transaction

```bash
curl -X POST http://localhost:9003/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx-first-transaction",
    "amount": 100.00
  }'
```

**Response:**
```json
{
  "transactionId": "tx-first-transaction",
  "status": "PROCESSED",
  "amount": 100.00,
  "timestamp": 1729543200000,
  "message": "Transaction processed successfully"
}
```

### 3. View Transaction Statistics

```bash
curl http://localhost:9003/api/v11/blockchain/transactions/stats
```

**Response:**
```json
{
  "totalProcessed": 1,
  "currentThroughputMeasurement": 1850000,
  "adaptiveBatchSizeMultiplier": 2.5,
  "throughputEfficiency": 0.925
}
```

### 4. Get Latest Block

```bash
curl http://localhost:9003/api/v11/blockchain/latest
```

**Response:**
```json
{
  "height": 1450789,
  "hash": "0x7b3a9c2d1f4e8a6b5c9d2e7f4a1b8c3d",
  "timestamp": 1729543200000,
  "transactions": 1523,
  "validator": "validator_0",
  "size": 258432
}
```

## Exploring the API

### Interactive API Explorer (Swagger UI)

1. Start the server: `./mvnw quarkus:dev`
2. Open your browser to: `http://localhost:9003/q/swagger-ui`
3. Explore all available endpoints
4. Test API calls directly from the browser

### Quarkus Dev UI

Access the comprehensive Dev UI at: `http://localhost:9003/q/dev`

Features:
- Configuration editor
- Health checks
- Metrics visualization
- gRPC services
- OpenAPI spec viewer

## Common Use Cases

### 1. Batch Transaction Processing

Process multiple transactions in a single request for improved efficiency:

```bash
curl -X POST http://localhost:9003/api/v11/blockchain/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {"transactionId": "tx-001", "amount": 50.00},
      {"transactionId": "tx-002", "amount": 75.50},
      {"transactionId": "tx-003", "amount": 100.25}
    ]
  }'
```

**Response:**
```json
{
  "requestedCount": 3,
  "processedCount": 3,
  "durationMs": 2.45,
  "transactionsPerSecond": 1224489,
  "status": "COMPLETED",
  "timestamp": 1729543200000
}
```

### 2. Blockchain Explorer

Query recent blocks:

```bash
curl "http://localhost:9003/api/v11/blockchain/blocks?limit=5&offset=0"
```

Get specific block by height:

```bash
curl http://localhost:9003/api/v11/blockchain/blocks/1450789
```

Get block by hash:

```bash
curl http://localhost:9003/api/v11/blockchain/block/0x7b3a9c2d1f4e8a6b5c9d2e7f4a1b8c3d
```

### 3. Performance Testing

Run a quick performance benchmark:

```bash
curl "http://localhost:9003/api/v11/performance?iterations=50000&threads=8"
```

**Response:**
```json
{
  "iterations": 50000,
  "durationMs": 27.15,
  "transactionsPerSecond": 1841981,
  "nsPerTransaction": 543.0,
  "optimizations": "Java/Quarkus + Virtual Threads",
  "threadCount": 8,
  "targetTPS": 2000000,
  "targetAchieved": false
}
```

### 4. Quantum Cryptography

Generate quantum-resistant keys:

```bash
curl -X POST http://localhost:9003/api/v11/crypto/keystore/generate \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": "my-secure-key",
    "algorithm": "KYBER"
  }'
```

Check quantum crypto status:

```bash
curl http://localhost:9003/api/v11/crypto/status
```

### 5. AI/ML Monitoring

View AI system status:

```bash
curl http://localhost:9003/api/v11/ai/status
```

List AI models:

```bash
curl http://localhost:9003/api/v11/ai/models
```

Get AI predictions:

```bash
curl http://localhost:9003/api/v11/ai/predictions
```

### 6. Network Monitoring

Get network statistics:

```bash
curl http://localhost:9003/api/v11/blockchain/network/stats
```

View active validators:

```bash
curl http://localhost:9003/api/v11/blockchain/validators
```

Get consensus status:

```bash
curl http://localhost:9003/api/v11/consensus/status
```

## Next Steps

### Learn More

- **Developer Guide**: [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Deep dive into development
- **API Reference**: [../api/README.md](../api/README.md) - Complete API documentation
- **Operations Guide**: [../operations/OPERATIONS-GUIDE.md](../operations/OPERATIONS-GUIDE.md) - Deployment and operations

### Configuration

Edit `src/main/resources/application.properties` to customize:

```properties
# HTTP port (default: 9003)
quarkus.http.port=9003

# Performance tuning
consensus.target.tps=3000000
consensus.batch.size=150000
consensus.parallel.threads=768

# AI optimization
ai.optimization.enabled=true
ai.optimization.target.tps=3000000

# LevelDB storage path
leveldb.data.path=/var/lib/aurigraph/leveldb/node-1
```

### Development Tips

1. **Hot Reload**: Code changes are automatically reloaded in dev mode
2. **Live Coding**: Modify Java files and see results immediately
3. **Dev Services**: Quarkus automatically starts required services (database, etc.)
4. **Continuous Testing**: Run `./mvnw quarkus:dev` with `-Dquarkus.test.continuous-testing=enabled`

### Testing

Run the test suite:

```bash
# All tests
./mvnw test

# Specific test class
./mvnw test -Dtest=AurigraphResourceTest

# Integration tests
./mvnw test -Dtest=*IT
```

### Building for Production

Build optimized native executable:

```bash
# Standard optimized build (~15 minutes)
./mvnw package -Pnative

# Ultra-optimized build (~30 minutes)
./mvnw package -Pnative-ultra

# Fast development build (~2 minutes)
./mvnw package -Pnative-fast
```

### Docker Deployment

```bash
# Build Docker image
docker build -f src/main/docker/Dockerfile.native -t aurigraph-v11:latest .

# Run container
docker run -p 9003:9003 aurigraph-v11:latest
```

### Monitoring

Access monitoring endpoints:

- **Health**: `http://localhost:9003/q/health`
- **Metrics**: `http://localhost:9003/q/metrics`
- **Prometheus**: Metrics are Prometheus-compatible

### Troubleshooting

#### Port Already in Use

```bash
# Check what's using port 9003
lsof -i :9003

# Kill the process
kill -9 <PID>

# Or change the port in application.properties
quarkus.http.port=9005
```

#### Java Version Issues

```bash
# Check Java version
java --version

# Set JAVA_HOME explicitly
export JAVA_HOME=/path/to/jdk-21
```

#### Native Build Fails

```bash
# Ensure Docker is running
docker info

# Clean and retry
./mvnw clean
./mvnw package -Pnative-fast
```

## Getting Help

- **Documentation**: [docs/](../)
- **API Issues**: Check [Swagger UI](http://localhost:9003/q/swagger-ui)
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **JIRA**: https://aurigraphdlt.atlassian.net
- **Email**: support@aurigraph.io

## Example Application

Check out the complete example application in `src/test/java/io/aurigraph/v11/examples/`:

```bash
# Run example
./mvnw test -Dtest=QuickStartExample
```

## What's Next?

Now that you have Aurigraph V11 running, explore:

1. **[Developer Guide](./DEVELOPER-GUIDE.md)** - Build applications on Aurigraph
2. **[API Reference](../api/README.md)** - Complete API documentation
3. **[Operations Guide](../operations/OPERATIONS-GUIDE.md)** - Deploy to production
4. **[Architecture](../../docs/architecture/)** - Understand system design
5. **[Contributing](../../CONTRIBUTING.md)** - Contribute to the project

---

**Welcome to Aurigraph V11!** You're now ready to build high-performance blockchain applications with quantum-resistant security.
