# Aurigraph V11 Native Quarkus/GraalVM Docker Deployment

## 🚀 Overview

This document provides comprehensive instructions for deploying Aurigraph V11 using native Quarkus/GraalVM Docker containers, achieving **2M+ TPS** with ultra-low latency and minimal resource usage.

## 📋 Prerequisites

- Docker 24.0+ with buildx support
- Docker Compose 2.0+
- 8GB RAM for building native images
- 50GB disk space
- Java 21+ (optional, for local builds)

## 🏗️ Docker Images

### Available Images

1. **Standard Native Container** (`Dockerfile.native`)
   - Based on UBI minimal
   - Full monitoring and logging
   - Size: ~150MB
   - Startup: <1s
   - Memory: <256MB

2. **Distroless Container** (`Dockerfile.native-distroless`)
   - Maximum security, minimal attack surface
   - No shell, package manager, or utilities
   - Size: ~100MB
   - Startup: <0.8s
   - Memory: <200MB

### Build Profiles

- **`native-fast`**: Development builds (~2 min)
- **`native`**: Standard production (~15 min)
- **`native-ultra`**: Maximum optimization (~30 min)

## 🔧 Quick Start

### Option 1: Interactive Quick Start

```bash
./docker-native-quickstart.sh
```

Select from menu:
1. Build and run single node
2. Build and run 3-node cluster
3. Build images only
4. Quick test with existing images

### Option 2: Command Line

```bash
# Single node
./docker-native-quickstart.sh --single

# Cluster deployment
./docker-native-quickstart.sh --cluster

# Build only
./docker-native-quickstart.sh --build
```

### Option 3: Manual Commands

```bash
# Build native image
docker build -f Dockerfile.native \
  --build-arg BUILD_PROFILE=native-ultra \
  -t aurigraph/v11-native:latest .

# Run single node
docker run -d \
  --name aurigraph-node \
  -p 9003:9003 \
  -e AURIGRAPH_TARGET_TPS=2000000 \
  aurigraph/v11-native:latest

# Start cluster
docker-compose -f docker-compose-native-cluster.yml up -d
```

## 🌐 Cluster Architecture

### 3-Node Configuration

```yaml
Node 1 (Leader):    Ports 9003-9005
Node 2 (Follower):  Ports 9013-9015  
Node 3 (Follower):  Ports 9023-9025
Load Balancer:      Port 8080
Prometheus:         Port 9090
Grafana:           Port 3000
```

### Network Topology

```
        ┌─────────────┐
        │Load Balancer│
        │  (HAProxy)  │
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Node 1 │ │Node 2 │ │Node 3 │
│Leader │ │Follow │ │Follow │
└───────┘ └───────┘ └───────┘
    │          │          │
    └──────────┼──────────┘
               │
        ┌──────▼──────┐
        │ Monitoring  │
        │(Prometheus) │
        └─────────────┘
```

## 📊 Performance Characteristics

### Native vs JVM Comparison

| Metric | Native | JVM |
|--------|--------|-----|
| **Startup Time** | <1s | 3-5s |
| **Memory Usage** | <256MB | 512MB+ |
| **Container Size** | 150MB | 400MB+ |
| **TPS Capability** | 2M+ | 1.5M |
| **CPU Efficiency** | 95% | 85% |
| **P99 Latency** | <50ms | <100ms |

### Resource Requirements

**Minimum (Single Node)**:
- CPU: 2 cores
- RAM: 512MB
- Disk: 10GB

**Recommended (3-Node Cluster)**:
- CPU: 8 cores
- RAM: 4GB
- Disk: 50GB

**Production (High Performance)**:
- CPU: 16+ cores
- RAM: 16GB
- Disk: 100GB SSD

## 🔐 Security Configuration

### Container Security

1. **Non-root User**: All containers run as user 1001
2. **Read-only Root**: Filesystem is read-only except /app/data
3. **No Capabilities**: Dropped all Linux capabilities
4. **Network Policies**: Restricted inter-container communication
5. **Secret Management**: Environment variables and mounted secrets

### TLS Configuration

```yaml
environment:
  QUARKUS_HTTP_SSL_CERTIFICATE_FILES: /certs/tls.crt
  QUARKUS_HTTP_SSL_CERTIFICATE_KEY_FILES: /certs/tls.key
  QUARKUS_HTTP_INSECURE_REQUESTS: redirect
```

## 📈 Monitoring & Observability

### Prometheus Metrics

Access at `http://localhost:9090`

Key metrics:
- `aurigraph_tps_rate` - Transactions per second
- `aurigraph_consensus_latency` - Consensus round time
- `aurigraph_memory_usage` - Memory consumption
- `aurigraph_cpu_usage` - CPU utilization

### Grafana Dashboards

Access at `http://localhost:3000` (admin/admin)

Available dashboards:
- Aurigraph Performance Overview
- Node Health Status
- Consensus Metrics
- Network Statistics

### Health Endpoints

```bash
# Readiness probe
curl http://localhost:9003/q/health/ready

# Liveness probe
curl http://localhost:9003/q/health/live

# Metrics
curl http://localhost:9003/q/metrics
```

## 🔄 Operations

### Scaling

```bash
# Scale to 5 nodes
docker-compose -f docker-compose-native-cluster.yml up -d --scale aurigraph-node=5

# Manual scaling with replicas
kubectl scale deployment aurigraph-v11 --replicas=10
```

### Rolling Updates

```bash
# Build new version
docker build -f Dockerfile.native -t aurigraph/v11-native:v11.1.0 .

# Update with zero downtime
docker-compose -f docker-compose-native-cluster.yml up -d --no-deps aurigraph-node-1
# Wait for health check
docker-compose -f docker-compose-native-cluster.yml up -d --no-deps aurigraph-node-2
docker-compose -f docker-compose-native-cluster.yml up -d --no-deps aurigraph-node-3
```

### Backup & Recovery

```bash
# Backup node data
docker run --rm -v aurigraph_node1-data:/data \
  -v $(pwd):/backup alpine tar czf /backup/node1-backup.tar.gz /data

# Restore node data
docker run --rm -v aurigraph_node1-data:/data \
  -v $(pwd):/backup alpine tar xzf /backup/node1-backup.tar.gz -C /
```

## 🐛 Troubleshooting

### Common Issues

**Container fails to start:**
```bash
# Check logs
docker logs aurigraph-node-1

# Verify image
docker run --rm aurigraph/v11-native:latest --version
```

**Performance issues:**
```bash
# Check resource usage
docker stats aurigraph-node-1

# Increase resources
docker update --cpus="4" --memory="1g" aurigraph-node-1
```

**Network connectivity:**
```bash
# Test inter-node communication
docker exec aurigraph-node-1 ping aurigraph-node-2

# Check port binding
netstat -an | grep 9003
```

### Debug Mode

```bash
# Run with debug logging
docker run -it \
  -e AURIGRAPH_LOG_LEVEL=DEBUG \
  -e QUARKUS_LOG_LEVEL=DEBUG \
  aurigraph/v11-native:latest
```

## 🚢 Production Deployment

### Kubernetes Deployment

```bash
# Apply production manifests
kubectl apply -f k8s/production-deployment-complete.yaml

# Check deployment
kubectl get pods -n aurigraph
kubectl get svc -n aurigraph
```

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose-native-cluster.yml aurigraph

# Check services
docker service ls
docker service logs aurigraph_aurigraph-node-1
```

## 📝 Environment Variables

### Core Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AURIGRAPH_NODE_ID` | Unique node identifier | `node-1` |
| `AURIGRAPH_TARGET_TPS` | Target transactions per second | `2000000` |
| `AURIGRAPH_CONSENSUS_TYPE` | Consensus algorithm | `hyperraft-plus` |
| `AURIGRAPH_CLUSTER_ENABLED` | Enable clustering | `true` |
| `AURIGRAPH_AI_OPTIMIZATION` | Enable AI optimization | `enabled` |

### Performance Tuning

| Variable | Description | Default |
|----------|-------------|---------|
| `AURIGRAPH_BATCH_SIZE` | Transaction batch size | `50000` |
| `AURIGRAPH_THREAD_POOL_SIZE` | Worker threads | `256` |
| `AURIGRAPH_MAX_CONNECTIONS` | Max network connections | `10000` |
| `AURIGRAPH_MEMORY_MODE` | Memory optimization | `optimized` |

### Security

| Variable | Description | Default |
|----------|-------------|---------|
| `AURIGRAPH_CRYPTO_MODE` | Cryptography mode | `quantum-resistant` |
| `AURIGRAPH_TLS_ENABLED` | Enable TLS | `true` |
| `AURIGRAPH_AUTH_ENABLED` | Enable authentication | `true` |

## 📚 Additional Resources

- [Quarkus Native Documentation](https://quarkus.io/guides/building-native-image)
- [GraalVM Native Image](https://www.graalvm.org/native-image/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Production Guide](https://kubernetes.io/docs/setup/production-environment/)

## 🤝 Support

For issues or questions:
- GitHub Issues: [Aurigraph-DLT/issues](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues)
- JIRA: [AV11 Project](https://aurigraphdlt.atlassian.net/jira/software/projects/AV11)
- Documentation: [/docs/project-av11/](../../docs/project-av11/)

---

**Version**: 11.0.0  
**Last Updated**: September 2025  
**Status**: Production Ready