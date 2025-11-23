# Aurigraph Node Release Management

## Version: 11.0.0

Comprehensive release documentation for Validator, Business, and Integration node builds.

## Release Structure

### Build Variants

Each node type is available in three build variants:

#### 1. Development (dev)
- **Purpose**: Local development and debugging
- **Compilation**: Full native build with debug symbols
- **Optimization**: Standard optimization level
- **Logging**: DEBUG level output
- **Resources**: Minimal (2-4 cores, 1-2GB RAM)
- **Image Size**: Large (~300-400MB with symbols)
- **Use Case**: Development, troubleshooting, testing

#### 2. Staging (staging)
- **Purpose**: Pre-production testing and performance validation
- **Compilation**: Fast native build with performance tuning
- **Optimization**: Performance-focused optimization
- **Logging**: INFO level output
- **Resources**: Medium (8-16 cores, 2-4GB RAM)
- **Image Size**: Medium (~200-300MB)
- **Use Case**: QA, performance testing, pre-release validation

#### 3. Production (prod)
- **Purpose**: High-performance production deployment
- **Compilation**: Ultra-optimized native build
- **Optimization**: Ultra-level optimization (aggressive inlining, JIT)
- **Logging**: WARN level output
- **Resources**: Full (16-32 cores, 4-8GB RAM)
- **Image Size**: Optimized (~150-250MB)
- **Use Case**: Production clusters, load testing, sustained operations

### Node Types

#### Validator Nodes
- **Role**: Consensus participation, block production
- **Features**: State management, block validation
- **Ports**: 9003-9035 (REST), 9004-9034 (gRPC)
- **Database**: Full state storage required
- **Min Resources**: 16 cores, 4GB RAM (prod)
- **Max Nodes per Container**: 8
- **Releases**:
  - `aurigraph-validator:11.0.0-dev`
  - `aurigraph-validator:11.0.0-staging`
  - `aurigraph-validator:11.0.0-prod`

#### Business Nodes
- **Role**: Transaction processing, smart contracts, API serving
- **Features**: Smart contract execution, RWA tokenization
- **Ports**: 9013-9045 (REST), 8080-8083 (Public API)
- **Database**: Partial state storage
- **Min Resources**: 8 cores, 2GB RAM (dev)
- **Max Nodes per Container**: 10
- **Releases**:
  - `aurigraph-business:11.0.0-dev`
  - `aurigraph-business:11.0.0-staging`
  - `aurigraph-business:11.0.0-prod`

#### Integration Nodes
- **Role**: Light query operations, APIs, external integrations
- **Features**: External API bridging (Polygon, CoinGecko, etc.), read-only access
- **Ports**: 9023-9073 (REST), 8090-8095 (Public API)
- **Database**: Minimal state caching only
- **Min Resources**: 4 cores, 1GB RAM (dev)
- **Max Nodes per Container**: 20
- **Releases**:
  - `aurigraph-integration:11.0.0-dev`
  - `aurigraph-integration:11.0.0-staging`
  - `aurigraph-integration:11.0.0-prod`

## Building Release Images

### Prerequisites
```bash
# Verify Java 21 is available
java --version

# Verify Maven is available
./mvnw --version

# Verify Docker is running
docker ps
```

### Build All Variants for All Node Types
```bash
chmod +x build-node-releases.sh

# Build all variants for all nodes
./build-node-releases.sh all all

# Build specific node type (all variants)
./build-node-releases.sh validator all
./build-node-releases.sh business all
./build-node-releases.sh integration all

# Build specific variant
./build-node-releases.sh all dev
./build-node-releases.sh validator prod
```

### Build Configuration
```bash
# Enable image testing during build
export ENABLE_TESTING=true

# Push to Docker registry after build
export DOCKER_REGISTRY=myregistry.azurecr.io

# Build and deploy
./build-node-releases.sh all all
```

## Deployment

### Docker Compose Deployment (Single Environment)

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Staging environment
docker-compose -f docker-compose.staging.yml up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Container Deployment

```bash
# Validator nodes
docker run -d \
  --name validator-1 \
  -p 9005:9005 \
  -e NODE_ID=validator-1 \
  -e JAVA_OPTS="-Xmx4g -Xms2g" \
  aurigraph-validator:11.0.0-prod

# Business nodes
docker run -d \
  --name business-1 \
  -p 9020:9020 \
  -p 8080:8080 \
  -e NODE_ID=business-1 \
  -e JAVA_OPTS="-Xmx2g -Xms1g" \
  aurigraph-business:11.0.0-prod

# Integration nodes
docker run -d \
  --name integration-1 \
  -p 9040:9040 \
  -p 8090:8090 \
  -e NODE_ID=integration-1 \
  -e JAVA_OPTS="-Xmx1g -Xms512m" \
  aurigraph-integration:11.0.0-prod
```

## Kubernetes Deployment

### Helm Chart Values (Recommended)

```yaml
# values.yaml
aurigraph:
  version: "11.0.0"

validators:
  replicas: 4
  image: aurigraph-validator:11.0.0-prod
  resources:
    requests:
      memory: "4Gi"
      cpu: "16"
    limits:
      memory: "8Gi"
      cpu: "32"

businessNodes:
  replicas: 3
  image: aurigraph-business:11.0.0-prod
  resources:
    requests:
      memory: "2Gi"
      cpu: "8"
    limits:
      memory: "4Gi"
      cpu: "16"

integrationNodes:
  replicas: 6
  image: aurigraph-integration:11.0.0-prod
  resources:
    requests:
      memory: "1Gi"
      cpu: "4"
    limits:
      memory: "2Gi"
      cpu: "8"
```

## Version History

### Version 11.0.0 (Current)

#### Validator Node
- **Release Date**: November 2025
- **Build Optimizations**: Native image with ultra-level optimization
- **Performance**: 776K TPS baseline, 2M+ TPS target
- **Features**: HyperRAFT++ consensus, NIST Level 5 crypto
- **Availability**: dev, staging, prod variants

#### Business Node
- **Release Date**: November 2025
- **Build Optimizations**: Performance-tuned native image
- **Features**: Smart contracts, RWA tokenization, public API
- **Availability**: dev, staging, prod variants

#### Integration Node
- **Release Date**: November 2025
- **Build Optimizations**: Optimized for throughput
- **Features**: External API bridging, light query mode
- **APIs Supported**: Polygon.io, CoinGecko, OpenWeatherMap, NewsAPI
- **Availability**: dev, staging, prod variants

## Release Checklist

### Pre-Release
- [ ] All tests passing (95%+ coverage)
- [ ] Performance benchmarks validated
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Version numbers bumped

### Build Phase
- [ ] Dev variant builds successfully
- [ ] Staging variant builds successfully
- [ ] Prod variant builds successfully
- [ ] All images pass health checks
- [ ] Docker scan results acceptable

### Testing Phase
- [ ] Unit tests pass (all variants)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests validated
- [ ] Load tests at 2M+ TPS

### Deployment Phase
- [ ] Images tagged and versioned
- [ ] Docker registry updated
- [ ] Kubernetes manifests updated
- [ ] Rolling deployment verified
- [ ] Health checks passing

### Post-Release
- [ ] Monitor production metrics
- [ ] Validate performance targets
- [ ] Document any issues
- [ ] Plan next release

## Troubleshooting

### Build Issues

**Issue**: Docker build fails with memory error
```bash
# Solution: Increase Docker memory
docker run --memory=8g ...
# Or set DOCKER_BUILDKIT_MEMORY
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
```

**Issue**: Native image compilation too slow
```bash
# Solution: Use fast build variant
./build-node-releases.sh validator staging
# Or enable parallel builds
export DOCKER_BUILDKIT=1
```

### Runtime Issues

**Issue**: Node container exits with health check failure
```bash
# Check logs
docker logs <container-name>

# Verify network connectivity
docker network inspect dlt-backend

# Check resource allocation
docker stats <container-name>
```

**Issue**: Low TPS performance
```bash
# Increase JVM heap
-e JAVA_OPTS="-Xmx8g -Xms4g"

# Enable verbose GC logging
-e JAVA_OPTS="-Xmx8g -Xms4g -verbose:gc"

# Scale horizontally (add more nodes)
```

## Performance Targets

### Validator Nodes
- **TPS**: 2M+ sustained
- **Finality**: <100ms
- **Memory**: <4GB per node
- **CPU**: <50% utilization at target TPS

### Business Nodes
- **TPS**: 1.5M+ sustained
- **Finality**: <200ms
- **Memory**: <2GB per node
- **CPU**: <60% utilization at target TPS

### Integration Nodes
- **Throughput**: 1M+ queries/sec
- **Query Latency**: <100ms p99
- **Memory**: <1GB per node
- **CPU**: <40% utilization at target load

## Support & Documentation

- **Build Script**: `build-node-releases.sh`
- **Configuration**: Docker Compose files for dev/staging/prod
- **Health Endpoints**: `http://localhost:PORT/q/health`
- **Metrics**: `http://localhost:PORT/q/metrics`
- **Logs**: Stdout/stderr (use `docker logs`)

## Future Roadmap

- [ ] gRPC service layer (v11.1.0)
- [ ] Multi-cloud deployment templates (v11.2.0)
- [ ] Advanced monitoring dashboards (v11.3.0)
- [ ] Automated performance scaling (v11.4.0)
- [ ] Carbon offset integration (v11.5.0)
