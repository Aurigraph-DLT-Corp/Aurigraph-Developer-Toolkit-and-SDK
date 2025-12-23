# Aurigraph V11 GraalVM Native Compilation Guide

## Overview

This guide provides complete setup and usage instructions for GraalVM native compilation of Aurigraph V11, optimized to achieve:

- **<1 second startup time**
- **<100MB binary size**  
- **2M+ TPS performance**
- **Full functionality in native mode**
- **Docker containerization ready**
- **Kubernetes deployment optimized**

## Prerequisites

### Required Software

1. **Java 21+** (GraalVM or OpenJDK)
   ```bash
   # Install SDKMAN (recommended)
   curl -s "https://get.sdkman.io" | bash
   source "$HOME/.sdkman/bin/sdkman-init.sh"
   
   # Install GraalVM
   sdk install java 21.0.1-graal
   sdk use java 21.0.1-graal
   
   # Or install OpenJDK 21
   sdk install java 21.0.1-open
   ```

2. **Docker** (for containerized builds)
   ```bash
   # macOS
   brew install docker
   
   # Ubuntu/Debian
   sudo apt-get install docker.io
   
   # CentOS/RHEL
   sudo yum install docker
   ```

3. **Kubernetes CLI** (for K8s deployments)
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

### System Requirements

- **Memory**: 8GB+ RAM (12GB+ recommended for native-ultra profile)
- **CPU**: 4+ cores (performance scales with cores)
- **Storage**: 10GB+ free space
- **OS**: Linux (preferred), macOS, Windows with WSL2

## Quick Start

### 1. Fast Development Build

```bash
# Quick native build for development
./quick-native-build.sh
```

This creates a development-optimized native binary in ~2-3 minutes.

### 2. Production Build

```bash
# Full production build with ultra optimization
./build-native.sh native-ultra prod

# Or with Docker image
./build-native.sh native-ultra prod true
```

### 3. Run Native Binary

```bash
# Find the binary
BINARY=$(find target -name "*-runner" -type f | head -1)

# Run directly
$BINARY

# Or with Docker
docker run -p 9003:9003 -p 9004:9004 aurigraph/v11-native:latest
```

## Build Profiles

### `native` (Balanced)
- **Build Time**: 5-8 minutes
- **Binary Size**: 60-80MB
- **Startup Time**: <800ms
- **Memory Usage**: 80-120MB
- **Use Case**: Standard production deployment

```bash
./mvnw package -Pnative -Dmaven.test.skip=true
```

### `native-fast` (Development)
- **Build Time**: 2-4 minutes
- **Binary Size**: 40-60MB
- **Startup Time**: <600ms
- **Memory Usage**: 60-100MB
- **Use Case**: Development and testing

```bash
./mvnw package -Pnative-fast -Dmaven.test.skip=true
```

### `native-ultra` (Maximum Performance)
- **Build Time**: 10-15 minutes
- **Binary Size**: 80-120MB
- **Startup Time**: <500ms
- **Memory Usage**: 100-150MB
- **TPS Performance**: 2M+ optimized
- **Use Case**: High-performance production

```bash
./mvnw package -Pnative-ultra -Dmaven.test.skip=true
```

## Docker Images

### Ultra-Micro Image (<30MB)
```bash
# Build micro image
docker build -f src/main/docker/Dockerfile.native-micro -t aurigraph-v11:micro .

# Size: <30MB, Startup: <500ms
docker run -p 9003:9003 -p 9004:9004 aurigraph-v11:micro
```

### Optimized Image (<100MB)
```bash
# Build optimized image
docker build -f src/main/docker/Dockerfile.native-optimized -t aurigraph-v11:optimized .

# Size: <100MB, Full features
docker run -p 9003:9003 -p 9004:9004 aurigraph-v11:optimized
```

## Performance Validation

### Automated Benchmark

```bash
# Run comprehensive performance tests
./performance-benchmark.sh

# This tests:
# - Startup time (<1s target)
# - Memory usage (<100MB target)
# - Response time (<100ms target)
# - TPS performance (2M+ target)
# - Native vs JVM comparison
```

### Expected Results

| Metric | Target | Native Result | JVM Result |
|--------|--------|---------------|------------|
| Startup Time | <1s | 400-800ms | 3-8s |
| Memory Usage | <100MB | 60-120MB | 200-500MB |
| Response Time | <100ms | 5-50ms | 10-100ms |
| Binary Size | <100MB | 40-120MB | N/A |
| TPS Performance | 2M+ | 2M-3M+ | 1M-2M |

### Manual Performance Tests

```bash
# Test startup time
time ./target/*-runner --help

# Test memory usage
./target/*-runner &
PID=$!
sleep 5
ps -p $PID -o pid,vsz,rss,comm
kill $PID

# Test response time
./target/*-runner &
sleep 5
curl -w "Response time: %{time_total}s\n" -s http://localhost:9003/q/health
```

## Configuration Files

### Native Image Configuration

The following files are automatically configured for optimal native compilation:

- **`src/main/resources/META-INF/native-image/reflect-config.json`**
  - Reflection configuration for all services
  - Crypto, consensus, AI, and gRPC classes included
  - BouncyCastle and ML library support

- **`src/main/resources/META-INF/native-image/serialization-config.json`**
  - Serialization configuration for data classes
  - Transaction, consensus, and AI model serialization

- **`src/main/resources/META-INF/native-image/jni-config.json`**
  - JNI configuration for native libraries
  - Crypto engines and performance libraries

- **`src/main/resources/META-INF/native-image/proxy-config.json`**
  - Dynamic proxy configuration
  - CDI and gRPC proxy support

- **`src/main/resources/META-INF/native-image/resource-config.json`**
  - Resource inclusion configuration
  - Protocol buffers, properties, certificates

### Application Configuration

Production-optimized settings in `application.properties`:

```properties
# Production consensus settings
consensus.batch.size=75000
consensus.pipeline.depth=64
consensus.parallel.threads=1024
consensus.target.tps=5000000

# AI optimization settings  
ai.optimization.enabled=true
ai.optimization.target.tps=3000000
ai.optimization.learning.rate=0.0001

# Performance tuning
quarkus.http.http2=true
quarkus.virtual-threads.enabled=true
grpc.max-concurrent-streams=20000
```

## Kubernetes Deployment

### Deploy to Kubernetes

```bash
# Deploy to development
./deploy-k8s.sh dev deploy

# Deploy to production
./deploy-k8s.sh prod deploy

# Update deployment
./deploy-k8s.sh prod update

# Check status
./deploy-k8s.sh prod status
```

### Kubernetes Optimizations

The deployment includes:

- **Resource Allocation**: Minimal memory requests (128Mi) due to native efficiency
- **Health Checks**: Fast health checks (2s initial delay) due to quick startup
- **Autoscaling**: HPA configured for 2M+ TPS scaling
- **Security**: Non-root containers, read-only filesystem
- **Monitoring**: Prometheus metrics and alerting

## Troubleshooting

### Build Issues

#### "Native image build failed"
```bash
# Increase memory for build
export MAVEN_OPTS="-Xmx8g"

# Or use container build
./mvnw package -Pnative -Dquarkus.native.container-build=true
```

#### "Class not found at runtime"
```bash
# Add missing class to reflect-config.json
{
  "name": "com.example.MissingClass",
  "allDeclaredConstructors": true,
  "allDeclaredMethods": true,
  "allDeclaredFields": true
}
```

#### "Resource not found"
```bash
# Add to resource-config.json
{
  "pattern": "path/to/resource\\.extension$"
}
```

### Runtime Issues

#### "Application starts but health check fails"
```bash
# Check application logs
docker logs container_id

# Verify health endpoint
curl http://localhost:9003/q/health
```

#### "Performance below expected"
```bash
# Verify production profile
export QUARKUS_PROFILE=prod

# Check CPU/memory allocation
docker stats container_id
```

### Memory Issues

#### "OutOfMemory during build"
```bash
# Increase build memory
./mvnw package -Pnative-fast \
  -Dquarkus.native.native-image-xmx=8g
```

#### "High memory usage at runtime"
```bash
# Use micro profile
QUARKUS_PROFILE=micro ./target/*-runner

# Or reduce batch sizes
consensus.batch.size=25000
```

## Advanced Configuration

### Custom Native Image Args

Add to `pom.xml` in native profile:

```xml
<quarkus.native.additional-build-args>
  -H:+UnlockExperimentalVMOptions,
  -H:+OptimizeStringConcat,
  -H:+UseCompressedOops,
  --initialize-at-run-time=custom.package
</quarkus.native.additional-build-args>
```

### Environment-Specific Builds

```bash
# Development build (fast)
QUARKUS_PROFILE=dev ./build-native.sh native-fast dev

# Staging build (balanced) 
QUARKUS_PROFILE=staging ./build-native.sh native staging

# Production build (optimized)
QUARKUS_PROFILE=prod ./build-native.sh native-ultra prod
```

### Custom Dockerfile

Create custom Dockerfile extending base:

```dockerfile
FROM aurigraph/v11-native:latest
COPY custom-config.properties /app/config/
ENV QUARKUS_PROFILE=custom
```

## Performance Tuning

### JVM Options (for comparison)

```bash
java -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=1 \
     -XX:+UseStringDeduplication \
     -Xmx512m \
     -jar target/aurigraph-v11-standalone-11.0.0.jar
```

### Native Binary Tuning

```bash
# Memory tuning
export MALLOC_ARENA_MAX=1
export MALLOC_MMAP_THRESHOLD_=32768

# CPU tuning  
export QUARKUS_VIRTUAL_THREADS_ENABLED=true
export CONSENSUS_PARALLEL_THREADS=1024
```

### Kubernetes Resource Tuning

```yaml
resources:
  requests:
    memory: "128Mi"  # Native efficiency
    cpu: "100m"      # Fast startup
  limits:
    memory: "512Mi"  # Conservative limit
    cpu: "2000m"     # High performance
```

## Monitoring and Metrics

### Built-in Endpoints

- **Health**: `http://localhost:9003/q/health`
- **Metrics**: `http://localhost:9003/q/metrics`
- **Ready**: `http://localhost:9003/q/health/ready`
- **Live**: `http://localhost:9003/q/health/live`

### Custom Metrics

The application exposes custom metrics for:

- Transaction processing rate (TPS)
- Consensus performance
- AI optimization effectiveness  
- Memory usage patterns
- Network throughput

### Prometheus Integration

```yaml
# Scrape config
scrape_configs:
- job_name: 'aurigraph-v11'
  static_configs:
  - targets: ['aurigraph-v11:9003']
  metrics_path: '/q/metrics'
  scrape_interval: 15s
```

## Production Checklist

### Pre-Deployment

- [ ] Native build completes successfully
- [ ] Binary size <100MB
- [ ] Startup time <1s
- [ ] Health checks pass
- [ ] Performance benchmark meets targets
- [ ] Docker image builds and runs
- [ ] Security scan passes

### Post-Deployment

- [ ] Application starts successfully
- [ ] Health endpoints accessible
- [ ] Metrics being collected
- [ ] Performance monitoring active
- [ ] Autoscaling configured
- [ ] Backup/recovery tested

### Production Monitoring

- [ ] TPS performance >2M
- [ ] Memory usage <100MB
- [ ] Response time <100ms
- [ ] Error rate <0.1%
- [ ] Availability >99.9%

## Support and Resources

### Documentation
- [Quarkus Native Guide](https://quarkus.io/guides/building-native-image)
- [GraalVM Documentation](https://www.graalvm.org/docs/)
- [Aurigraph Architecture Guide](../docs/AURIGRAPH-V11-PRD.md)

### Troubleshooting
- Check build logs in `build-native.log`
- Performance reports in `benchmark-results/`
- Kubernetes logs: `kubectl logs -n aurigraph-system deployment/aurigraph-v11-native`

### Community
- GitHub Issues: Report problems and feature requests
- Documentation: Contribute improvements to guides
- Performance: Share benchmark results and optimizations

---

**Aurigraph DLT V11** - Ultra-High Performance Blockchain Platform  
Native Compilation Optimized for Production Workloads