# Aurigraph V11 Production Deployment Guide

## Phase 4: Production Readiness - Complete Implementation

This guide provides comprehensive instructions for deploying Aurigraph V11 in production environments with full containerization, monitoring, and high availability.

## 🎯 Overview

The Phase 4 production readiness implementation includes:

- ✅ **Multi-stage Docker builds** (Native & JVM)
- ✅ **Docker Compose orchestration** with full service stack
- ✅ **Kubernetes deployment manifests** with auto-scaling
- ✅ **Comprehensive monitoring** with Prometheus & Grafana
- ✅ **High-performance NGINX load balancer**
- ✅ **Production configuration profiles**
- ✅ **Automated deployment scripts**
- ✅ **Health checks and readiness probes**

## 📋 Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 8 cores (16 threads)
- Memory: 16GB RAM
- Storage: 100GB SSD
- Network: 1 Gbps

**Recommended for 2M+ TPS:**
- CPU: 32 cores (64 threads) 
- Memory: 64GB RAM
- Storage: 1TB NVMe SSD
- Network: 10 Gbps

### Software Dependencies

```bash
# Required tools
docker >= 24.0.0
kubectl >= 1.28.0
helm >= 3.12.0
jq >= 1.6

# Optional but recommended
docker-compose >= 2.20.0
k9s >= 0.27.0
```

### Kubernetes Cluster

- Kubernetes 1.28+ cluster
- Ingress controller (NGINX recommended)
- Storage provisioner (for persistent volumes)
- Metrics server (for HPA)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd aurigraph-av10-7/aurigraph-v11-standalone/

# Make deployment script executable (already done)
chmod +x scripts/deploy.sh

# Create required directories
mkdir -p data/{aurigraph,logs} config/secrets
```

### 2. Configure Secrets

Create `config/secrets.env`:

```bash
# Database credentials
DB_USERNAME=aurigraph_user
DB_PASSWORD=your_secure_password
DB_URL=jdbc:postgresql://postgres:5432/aurigraph_v11

# API Keys
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret

# Service credentials
REGISTRY_USERNAME=your_registry_user
REGISTRY_PASSWORD=your_registry_password
VAULT_TOKEN=your_vault_token
```

### 3. Deploy with Docker Compose (Local/Development)

```bash
# Deploy native build with monitoring
docker-compose up -d

# Deploy JVM build
docker-compose --profile jvm up -d

# Deploy with monitoring stack
docker-compose --profile monitoring up -d
```

### 4. Deploy to Kubernetes (Production)

```bash
# Deploy with all defaults (native build)
./scripts/deploy.sh

# Deploy with specific configuration
./scripts/deploy.sh \
  --type native \
  --env production \
  --namespace aurigraph-system \
  --version 11.0.0 \
  --push \
  --monitoring

# Deploy JVM build to staging
./scripts/deploy.sh --type jvm --env staging
```

## 🏗️ Architecture Overview

### Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer (NGINX)                                          │
│  ├── HTTPS/HTTP2 → Aurigraph V11 HTTP API (9003)              │
│  └── gRPC → Aurigraph V11 gRPC Service (9004)                 │
├─────────────────────────────────────────────────────────────────┤
│  Application Tier                                               │
│  ├── Aurigraph V11 Native (Primary)                           │
│  ├── Aurigraph V11 JVM (Backup)                               │
│  └── Auto-scaling (HPA/VPA)                                   │
├─────────────────────────────────────────────────────────────────┤
│  Supporting Services                                            │
│  ├── Consul (Service Discovery)                               │
│  ├── Vault (Secrets Management)                               │
│  ├── Redis (Caching)                                          │
│  └── PostgreSQL (Data Storage)                                │
├─────────────────────────────────────────────────────────────────┤
│  Monitoring & Observability                                    │
│  ├── Prometheus (Metrics Collection)                          │
│  ├── Grafana (Visualization)                                  │
│  ├── Fluentd (Log Aggregation)                               │
│  └── Jaeger (Distributed Tracing)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Network Configuration

- **HTTP API**: Port 9003 (HTTP/2 with TLS 1.3)
- **gRPC Service**: Port 9004 (High-performance gRPC)
- **HMS gRPC**: Port 9005 (Healthcare/Financial services)
- **Metrics**: `/q/metrics` endpoint
- **Health**: `/q/health/*` endpoints

## 📦 Build Configuration

### Multi-Stage Docker Build

The `Dockerfile` supports multiple build types:

```bash
# Native build (fastest runtime, longest build)
docker build --build-arg BUILD_TYPE=native .

# Fast native build (development)
docker build --build-arg BUILD_TYPE=native-fast .

# JVM build (compatible, faster build)
docker build --build-arg BUILD_TYPE=jvm .
```

### Build Profiles

1. **native-ultra**: Maximum optimization (30+ min build, <1s startup)
2. **native-fast**: Quick optimization (2 min build, <1s startup)
3. **jvm**: Standard JAR (1 min build, ~3s startup)

## ⚙️ Configuration Profiles

### Application Profiles

- **Development**: `application.properties` (default)
- **Production**: `application-prod.properties` (optimized)
- **Testing**: `application-test.properties`

### Environment Variables

Key environment variables for production:

```bash
# Core Configuration
QUARKUS_PROFILE=prod
CONSENSUS_NODE_ID=aurigraph-prod-node-1
CONSENSUS_CLUSTER_SIZE=15

# Performance Tuning
AI_OPTIMIZATION_ENABLED=true
AI_OPTIMIZATION_TARGET_TPS=5000000
AURIGRAPH_ULTRA_PERFORMANCE_MODE=true

# Security
VAULT_TOKEN=${VAULT_TOKEN}
DB_PASSWORD=${DB_PASSWORD}

# JVM Optimization (for JVM builds)
JAVA_OPTS_APPEND="-XX:+UseG1GC -XX:MaxGCPauseMillis=100"
```

## 🎛️ Monitoring & Observability

### Prometheus Metrics

Key metrics exposed:

```prometheus
# Transaction metrics
aurigraph_transactions_processed_total
aurigraph_transaction_duration_seconds
aurigraph_transactions_failed_total

# Consensus metrics
aurigraph_consensus_leader_elections_total
aurigraph_consensus_commits_total
aurigraph_consensus_active_validators

# AI optimization metrics
aurigraph_ai_optimization_accuracy
aurigraph_ai_optimization_predictions_total

# System metrics
aurigraph_memory_usage_bytes
aurigraph_cpu_usage_percent
```

### Health Checks

- **Liveness**: `/q/health/live` - Service is running
- **Readiness**: `/q/health/ready` - Service ready for traffic
- **Startup**: `/q/health/started` - Initial startup complete

### Logging

Production logging configuration:
- **Format**: JSON structured logs
- **Level**: INFO (DEBUG for performance components)
- **Rotation**: 100MB files, 10 backup files
- **Location**: `/deployments/logs/`

## 🔒 Security Configuration

### Network Security

- **TLS 1.3**: All HTTPS traffic
- **mTLS**: Inter-service communication
- **Network Policies**: Kubernetes network isolation
- **Rate Limiting**: API endpoint protection

### Container Security

- **Non-root user**: Runs as UID 1001
- **Read-only filesystem**: Immutable container
- **Security contexts**: Minimal privileges
- **Image scanning**: Automated vulnerability detection

### Secrets Management

- **Vault integration**: Centralized secret storage
- **Kubernetes secrets**: Runtime secret injection
- **Environment isolation**: Per-environment secrets

## 🔧 Operational Commands

### Docker Compose Operations

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f aurigraph-v11-native

# Scale services
docker-compose up -d --scale aurigraph-v11-native=3

# Update configuration
docker-compose restart aurigraph-v11-native

# Stop services
docker-compose down
```

### Kubernetes Operations

```bash
# Check deployment status
kubectl get pods -n aurigraph-system -l app=aurigraph-v11

# View logs
kubectl logs -n aurigraph-system -l app=aurigraph-v11 -f

# Scale deployment
kubectl scale deployment aurigraph-v11-native -n aurigraph-system --replicas=5

# Rolling update
kubectl set image deployment/aurigraph-v11-native aurigraph-v11=aurigraph/v11-native:11.0.1 -n aurigraph-system

# Port forward for local access
kubectl port-forward -n aurigraph-system svc/aurigraph-v11-service 9003:9003
```

### Monitoring Commands

```bash
# Access Prometheus
kubectl port-forward -n aurigraph-system svc/prometheus 9090:9090

# Access Grafana
kubectl port-forward -n aurigraph-system svc/grafana 3000:3000
# Default credentials: admin/admin123

# View metrics
curl http://localhost:9003/q/metrics
```

## 🚨 Troubleshooting

### Common Issues

**1. Startup Failures**
```bash
# Check pod status
kubectl describe pod <pod-name> -n aurigraph-system

# Check logs
kubectl logs <pod-name> -n aurigraph-system --previous

# Check resource constraints
kubectl top pods -n aurigraph-system
```

**2. Performance Issues**
```bash
# Check TPS metrics
curl http://localhost:9003/q/metrics | grep aurigraph_transactions

# Check resource usage
kubectl top pods -n aurigraph-system

# Check AI optimization status
curl http://localhost:9003/api/v11/performance
```

**3. Network Connectivity**
```bash
# Test internal service resolution
kubectl exec -it <pod-name> -n aurigraph-system -- nslookup aurigraph-v11-service

# Test external connectivity
kubectl exec -it <pod-name> -n aurigraph-system -- curl -I https://api.alpaca.markets
```

### Performance Tuning

**For 2M+ TPS targets:**

1. **CPU Affinity**: Enable in production config
2. **NUMA Awareness**: Configure for multi-socket systems
3. **Virtual Threads**: Increase pool size for high concurrency
4. **Batch Size**: Optimize based on workload patterns
5. **AI Optimization**: Enable with appropriate learning rates

### Scaling Strategies

**Horizontal Scaling:**
- Use HPA for automatic pod scaling
- Configure appropriate CPU/memory thresholds
- Implement proper load balancing

**Vertical Scaling:**
- Use VPA for resource recommendation
- Monitor memory allocation patterns
- Adjust JVM heap sizes for JVM deployments

## 📊 Performance Benchmarks

### Target Metrics (Production)

| Metric | Target | Current | Status |
|--------|---------|---------|---------|
| TPS | 2M+ | 776K | 🔄 Optimizing |
| Latency (p99) | <10ms | ~15ms | 🔄 Optimizing |
| Startup Time | <1s | <1s | ✅ Achieved |
| Memory Usage | <512MB | <256MB | ✅ Achieved |
| CPU Efficiency | >80% | ~75% | 🔄 Optimizing |

### Optimization Roadmap

1. **Phase 4.1**: Complete gRPC implementation
2. **Phase 4.2**: Advanced consensus optimizations
3. **Phase 4.3**: AI-driven performance tuning
4. **Phase 4.4**: Hardware-specific optimizations

## 🎯 Production Checklist

### Pre-Deployment

- [ ] Resource requirements validated
- [ ] Security configurations reviewed
- [ ] Backup and recovery procedures tested
- [ ] Monitoring dashboards configured
- [ ] Load testing completed
- [ ] Documentation updated

### Deployment

- [ ] Secrets properly configured
- [ ] Network policies applied
- [ ] Health checks responding
- [ ] Monitoring active
- [ ] Log aggregation working
- [ ] Performance metrics baseline established

### Post-Deployment

- [ ] End-to-end testing completed
- [ ] Performance benchmarks validated
- [ ] Security scan passed
- [ ] Operational runbooks updated
- [ ] Team training completed
- [ ] Incident response procedures tested

## 📚 Additional Resources

### Documentation Links

- [Kubernetes Deployment Guide](k8s/README.md)
- [Monitoring Setup Guide](config/prometheus/README.md)
- [Security Configuration Guide](docs/security.md)
- [Performance Tuning Guide](docs/performance.md)

### Support Contacts

- **Technical Lead**: Aurigraph DLT Team
- **DevOps Lead**: Infrastructure Team  
- **Security Lead**: Security Team

---

## 🚀 Conclusion

This Phase 4 implementation provides a complete production-ready deployment solution for Aurigraph V11, with comprehensive monitoring, security, and scalability features. The configuration supports both local development and large-scale production deployments with automatic scaling and high availability.

For questions or support, please refer to the team contacts above or create an issue in the project repository.