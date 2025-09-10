# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Aurigraph DLT V11** - High-performance blockchain platform migration from TypeScript (V10) to Java/Quarkus/GraalVM architecture targeting 2M+ TPS with quantum-resistant cryptography and AI-driven consensus.

**Current Migration Status**: ~30% complete
- ✅ Core Java/Quarkus structure 
- ✅ REST API and health endpoints
- ✅ Native compilation with optimized profiles
- ✅ AI optimization services (ML-based consensus)
- ✅ HMS integration for real-world asset tokenization
- 🚧 gRPC service implementation 
- 🚧 Performance optimization (currently 776K TPS)
- 📋 Full consensus migration from TypeScript

## Essential Commands

### V11 Java/Quarkus Development
```bash
# Navigate to V11 standalone project
cd aurigraph-av10-7/aurigraph-v11-standalone/

# Development
./mvnw quarkus:dev              # Hot reload dev mode (port 9003)
./mvnw compile quarkus:dev      # Compile and start dev mode

# Build and Package
./mvnw clean package            # Standard JAR build
./mvnw package -Dquarkus.package.jar.type=uber-jar  # Uber JAR

# Testing
./mvnw test                     # All tests
./mvnw test -Dtest=AurigraphResourceTest  # Specific test
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput  # Specific method

# Native Compilation (3 profiles available)
./mvnw package -Pnative-fast    # Fast development native build
./mvnw package -Pnative         # Standard optimized native build  
./mvnw package -Pnative-ultra   # Ultra-optimized production build

# Run native executable
./target/aurigraph-v11-standalone-11.0.0-runner

# Performance testing scripts
./performance-benchmark.sh      # Comprehensive performance test
./run-performance-tests.sh     # JMeter-based load testing

# Quick native build (development)
./quick-native-build.sh        # Uses native-fast profile
```

### V10 TypeScript Development (Legacy Support)
```bash
# From aurigraph-av10-7/ directory  
npm install && npm run build   # Install and build
npm start                      # Start V10 platform (port 8080)
npm run test:all              # Full test suite
npm run deploy:dev4           # Deploy to dev4 environment
```

## High-Level Architecture

### V11 Java/Quarkus Architecture (Primary Focus)

```
aurigraph-v11-standalone/
├── src/main/
│   ├── java/io/aurigraph/v11/
│   │   ├── AurigraphResource.java         # REST API endpoints
│   │   ├── TransactionService.java        # Core transaction processing
│   │   ├── ai/                           # AI optimization components
│   │   │   ├── AIOptimizationService.java # ML-based consensus optimization  
│   │   │   ├── PredictiveTransactionOrdering.java
│   │   │   └── AnomalyDetectionService.java
│   │   ├── consensus/                    # HyperRAFT++ consensus 
│   │   │   ├── HyperRAFTConsensusService.java
│   │   │   └── ConsensusModels.java
│   │   ├── crypto/                       # Quantum-resistant crypto
│   │   │   ├── QuantumCryptoService.java # CRYSTALS-Kyber/Dilithium
│   │   │   └── DilithiumSignatureService.java
│   │   ├── grpc/                        # gRPC services
│   │   │   ├── AurigraphV11GrpcService.java  
│   │   │   └── HighPerformanceGrpcService.java
│   │   ├── bridge/                      # Cross-chain bridge
│   │   │   ├── CrossChainBridgeService.java
│   │   │   └── adapters/                # Chain-specific adapters
│   │   └── hms/                        # HMS integration
│   │       └── HMSIntegrationService.java # Real-world asset tokenization
│   ├── proto/
│   │   ├── aurigraph-v11.proto          # V11 protocol definitions
│   │   └── hms-integration.proto        # HMS protocol definitions
│   └── resources/
│       ├── application.properties        # Quarkus configuration
│       └── META-INF/native-image/       # Native compilation configs
└── pom.xml                              # Maven configuration with 3 native profiles
```

### Key Technology Stack
- **Framework**: Quarkus 3.26.2 with reactive programming (Mutiny)
- **Runtime**: Java 21 with Virtual Threads
- **Native**: GraalVM native compilation with 3 optimization profiles
- **Protocol**: gRPC with Protocol Buffers + HTTP/2 REST
- **Testing**: JUnit 5, Mockito, JMeter integration
- **AI/ML**: DeepLearning4J, Apache Commons Math, SMILE ML library
- **Crypto**: BouncyCastle for post-quantum cryptography

## Service Endpoints & Configuration

### V11 Primary Services (Port 9003)
```bash
# REST API endpoints
curl http://localhost:9003/api/v11/health         # Health status
curl http://localhost:9003/api/v11/info           # System information  
curl http://localhost:9003/api/v11/performance    # Performance testing
curl http://localhost:9003/api/v11/stats          # Transaction statistics

# Quarkus built-in endpoints
curl http://localhost:9003/q/health               # Quarkus health checks
curl http://localhost:9003/q/metrics              # Prometheus metrics
curl http://localhost:9003/q/dev/                 # Dev UI (dev mode only)

# gRPC service (planned)
grpcurl -plaintext localhost:9004 list            # List gRPC services
```

### V10 Legacy Services (Reference)
- Main Platform: `http://localhost:8080`
- Management API: `http://localhost:3040` 
- Monitoring API: `http://localhost:3001`

## Performance & Requirements

### Current V11 Performance
- **Achieved TPS**: ~776K (optimization ongoing)
- **Target TPS**: 2M+ (production goal)
- **Startup Time**: <1s native, ~3s JVM
- **Memory Usage**: <256MB native, ~512MB JVM
- **Transport**: HTTP/2 with TLS 1.3, gRPC ready

### V11 Native Compilation Profiles
1. **`-Pnative-fast`**: Development builds (~2 min, -O1 optimization)
2. **`-Pnative`**: Standard production (~15 min, optimized)  
3. **`-Pnative-ultra`**: Ultra-optimized production (~30 min, -march=native)

## Testing Strategy & Quality Requirements

### V11 Testing Framework
```bash
# Unit tests - JUnit 5 with Mockito
./mvnw test                                    # All tests
./mvnw test -Dtest=AurigraphResourceTest      # Specific class
./mvnw test -Dtest=*Test#testPerformance*     # Pattern matching

# Integration tests with TestContainers
./mvnw test -Dtest=*IT                        # Integration tests only

# Performance tests with JMeter integration
./performance-benchmark.sh                    # Comprehensive benchmark
./run-performance-tests.sh                   # JMeter load tests

# Native image tests
./mvnw test -Dnative                          # Test native executable
```

### Coverage Requirements  
- **Target Coverage**: 95% line, 90% function
- **Critical Modules**: crypto (98%), consensus (95%), grpc (90%)
- **Current Status**: ~15% coverage (migration in progress)

### Environment Configuration

#### V11 Configuration Properties
```bash
# Core settings in application.properties
quarkus.http.port=9003                        # Changed from 9000 due to conflicts
quarkus.grpc.server.port=9004                 # gRPC service port
quarkus.virtual-threads.enabled=true          # Java 21 virtual threads

# Performance tuning
consensus.target.tps=2000000                  # Production TPS target
consensus.batch.size=10000                    # Transaction batch size
consensus.parallel.threads=256                # Processing threads

# AI/ML optimization
ai.optimization.enabled=true                  # Enable ML optimization
ai.optimization.target.tps=3000000           # AI TPS target

# HMS integration  
hms.performance.target.tps=100000            # HMS TPS target
hms.grpc.port=9005                           # HMS gRPC port
```

## Migration Status & Critical Requirements

### V11 Migration Requirements
1. **100% Java/Quarkus/GraalVM** - No TypeScript dependencies
2. **gRPC + Protocol Buffers** - All internal service communication  
3. **HTTP/2 with TLS 1.3** - High-performance transport layer
4. **Native Compilation** - Sub-second startup required for production
5. **Java 21 Virtual Threads** - Concurrency without OS thread limits

### Component Migration Progress
- ✅ Core Quarkus application structure
- ✅ REST API with reactive endpoints (`AurigraphResource.java`)
- ✅ Transaction processing service (`TransactionService.java`)
- ✅ AI optimization framework (ML-based consensus tuning)
- ✅ Native compilation with 3 optimization profiles
- ✅ HMS integration for real-world asset tokenization
- 🚧 gRPC service implementation (`HighPerformanceGrpcService.java`)
- 🚧 HyperRAFT++ consensus migration (`HyperRAFTConsensusService.java`)
- 🚧 Performance optimization (776K → 2M+ TPS target)
- 📋 Quantum cryptography service migration
- 📋 Cross-chain bridge service migration
- 📋 Complete test suite migration (currently ~15% coverage)

## Debugging & Troubleshooting

### V11 Java/Quarkus Issues
```bash
# Java version check (requires 21+)
java --version
echo $JAVA_HOME

# Docker for native builds
docker --version
docker info | grep "Server Version"

# Port conflicts
lsof -i :9003 && sudo kill -9 <PID>         # Main HTTP port
lsof -i :9004 && sudo kill -9 <PID>         # gRPC port

# Native build troubleshooting  
./validate-native-setup.sh                   # Validate native setup
./mvnw clean                                 # Clean before retry
docker system prune -f                      # Clean Docker cache

# Performance debugging
./mvnw quarkus:dev -Dquarkus.profile=dev    # Debug profile
./mvnw quarkus:dev -Dquarkus.log.category."io.aurigraph".level=DEBUG

# JVM options for development
export MAVEN_OPTS="-Xmx4g -XX:+UseG1GC"
```

### Common V11 Development Patterns
```bash
# Rapid development cycle
./mvnw quarkus:dev                           # Start dev mode (hot reload)
# Make Java changes -> automatic reload
curl localhost:9003/api/v11/health          # Test endpoint

# Performance testing cycle  
./mvnw clean package -Pnative-fast          # Quick native build
./target/*-runner                            # Run native
./performance-benchmark.sh                  # Benchmark TPS
```

## Development Workflow & Integration

### V11 Development Workflow
1. **Navigate to V11 project**: `cd aurigraph-av10-7/aurigraph-v11-standalone/`
2. **Start development**: `./mvnw quarkus:dev` (hot reload enabled)
3. **Implement feature**: Follow reactive programming patterns (Uni/Multi)
4. **Add tests**: JUnit 5 with 95% coverage requirement
5. **Validate performance**: Use `/api/v11/performance` endpoint
6. **Build native**: `./mvnw package -Pnative-fast` for quick validation

### V11 Code Patterns
```java
// Reactive endpoint pattern
@GET
@Path("/endpoint")
public Uni<ResponseType> reactiveEndpoint() {
    return Uni.createFrom().item(() -> {
        // Processing logic
        return result;
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}

// gRPC service pattern (when implemented)
@GrpcService
public class MyGrpcService implements MyService {
    public Uni<Response> processRequest(Request request) {
        // Reactive gRPC processing
    }
}
```

### Integration Points

#### GitHub & JIRA
- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **Branch Strategy**: `feature/aurigraph-v11-*` for V11 migration work

#### Deployment & Infrastructure  
- **Dev4 Environment**: AWS-based development cluster
- **Container Strategy**: Docker-based native builds via GraalVM
- **Kubernetes**: Configs in `k8s/` directory with HPA/VPA scaling

#### Performance Validation
- **Local Testing**: `./performance-benchmark.sh` (comprehensive)
- **Load Testing**: `./run-performance-tests.sh` (JMeter integration)
- **Target Metrics**: 2M+ TPS, <1s startup, <256MB memory