# Aurigraph V11 - Native Validator Cluster Deployment Guide

**Version**: 11.4.4
**Build Date**: November 11, 2025
**Status**: Production Ready

---

## Overview

This guide provides step-by-step instructions for deploying the Aurigraph V11 native validator cluster with Quarkus/GraalVM optimization and integrated LevelDB database.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Validator Cluster                              │
│                    (12 validator nodes)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Validator 1    │  │   Validator 2    │  │   Validator 3    │  │
│  │ (3 nodes/cont)   │  │ (3 nodes/cont)   │  │ (3 nodes/cont)   │  │
│  │ :9003, :9004     │  │ :9013, :9014     │  │ :9023, :9024     │  │
│  ├─ LevelDB        │  ├─ LevelDB        │  ├─ LevelDB        │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                 │                      │             │
│  ┌──────────────────┐          │                      │             │
│  │   Validator 4    │◄─────────┴──────────────────────┘             │
│  │ (3 nodes/cont)   │                                               │
│  │ :9033, :9034     │                                               │
│  ├─ LevelDB        │                                               │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   │ Business Nodes  │ │  Slim Nodes     │ │ Infrastructure  │
   │  (8 nodes)      │ │  (6 nodes)      │ │                 │
   │  :9006-9036     │ │  :9009-9059     │ │ PostgreSQL      │
   │  ├─ LevelDB     │ │  ├─ LevelDB     │ │ Redis           │
   │  │              │ │  │              │ │ Prometheus      │
   │  └─ Fast Sync   │ │  └─ Archive     │ │ Grafana         │
   └─────────────────┘ └─────────────────┘ │ HAProxy         │
                                            │ Jaeger          │
                                            └─────────────────┘
```

### Performance Targets

| Metric | Target | Achievement |
|--------|--------|-------------|
| TPS | 2M+ | 776K+ (baseline, optimizing) |
| Startup | <1s | Achieved (native) |
| Memory | <256MB | Achieved (native) |
| Finality | <100ms | <500ms (target: <100ms) |
| Network | HTTP/2 + gRPC | Configured |

---

## Prerequisites

### System Requirements

**Minimum**:
- 16 CPU cores
- 32GB RAM
- 500GB SSD storage
- Ubuntu 20.04+ or macOS 12+
- Docker 24.0+
- Docker Compose 2.20+

**Recommended (Production)**:
- 32+ CPU cores
- 64GB+ RAM
- 2TB+ SSD storage (NVMe)
- Dedicated network interfaces
- Multiple availability zones

### Software Requirements

```bash
# Verify versions
docker --version              # >= 24.0
docker-compose --version      # >= 2.20
java --version               # >= 21 (for local native builds)
maven --version              # >= 3.9
git --version                # >= 2.30
```

### Network Requirements

**Open Ports**:
- `9003-9005`: Validator HTTP/gRPC/Metrics
- `9006-9008`: Business nodes HTTP/gRPC/Metrics
- `9009-9011`: Slim nodes HTTP/gRPC/Metrics
- `9013-9015`, `9023-9025`, `9033-9035`: Additional validator node ports
- `8080-8082`: HAProxy load balancer
- `5432`: PostgreSQL database
- `6379`: Redis cache
- `9100`: Prometheus metrics
- `3001`: Grafana dashboard
- `16686`: Jaeger tracing UI

**Firewall Rules**:
```bash
# Allow validator cluster communication
sudo ufw allow 9000:9100/tcp
sudo ufw allow 9000:9100/udp

# Allow external access to APIs
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp

# Allow monitoring access (restrict to local network in production)
sudo ufw allow 3001/tcp
sudo ufw allow 9100/tcp
```

---

## Deployment Steps

### Step 1: Prepare the Environment

```bash
# Clone or update repository
cd /opt/aurigraph-dlt
git pull origin main

# Create configuration directories
mkdir -p config/validators config/business config/slim
mkdir -p config/prometheus config/grafana config/haproxy
mkdir -p init-scripts

# Navigate to validator deployment directory
cd $(git rev-parse --show-toplevel)
```

### Step 2: Review and Customize Configuration

#### 2.1 Review docker-compose-validators.yml

```bash
# Check configuration for your environment
cat docker-compose-validators.yml | grep -E "cpus|memory|AURIGRAPH" | head -30

# Expected output shows:
# - 8 CPU cores per validator
# - 512MB memory limit per validator
# - AURIGRAPH_TARGET_TPS: 2000000
# - AURIGRAPH_CONSENSUS_TYPE: hyperraft-plus
```

#### 2.2 Customize Resource Allocation (if needed)

Edit `docker-compose-validators.yml`:

```yaml
x-resource-limits: &resource-limits
  deploy:
    resources:
      limits:
        cpus: '8'          # Increase for higher TPS targets
        memory: 512M       # Increase for large states
      reservations:
        cpus: '4'          # Reserve minimum CPUs
        memory: 256M       # Reserve minimum memory
```

#### 2.3 Configure Network (if using custom subnet)

```yaml
networks:
  aurigraph-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.29.0.0/16  # Change if conflicts with existing networks
```

### Step 3: Build Native Docker Images

```bash
# Build native validators (first build takes 2-10 minutes)
echo "🔨 Building native validator image..."
docker build -t aurigraph/v11-native:latest \
  --build-arg BUILD_PROFILE=native-ultra \
  --build-arg OPTIMIZATION_LEVEL=3 \
  -f aurigraph-av10-7/aurigraph-v11-standalone/Dockerfile.native \
  aurigraph-av10-7/aurigraph-v11-standalone/

# Verify build success
docker images | grep aurigraph/v11-native

# Expected output:
# aurigraph/v11-native   latest   <IMAGE_ID>   Just now
```

**Build Time Estimates**:
- `native-ultra`: 2-10 minutes (maximum optimization)
- `native-fast`: 1-2 minutes (production optimization)
- `jvm`: 35 seconds (JVM fallback)

### Step 4: Start Infrastructure Services

```bash
# Start only infrastructure (PostgreSQL, Redis, Prometheus, Grafana)
# This allows validators to initialize their state
docker-compose -f docker-compose-validators.yml up -d \
  postgres redis prometheus grafana jaeger

# Wait for services to be ready
echo "⏳ Waiting for infrastructure to initialize..."
sleep 30

# Verify infrastructure health
docker-compose -f docker-compose-validators.yml ps postgres redis
```

### Step 5: Start Validator Nodes

```bash
# Start all validator containers (4 containers × 3 nodes = 12 validators)
echo "🚀 Starting validator nodes..."
docker-compose -f docker-compose-validators.yml up -d validator-1 validator-2 validator-3 validator-4

# Monitor startup (should see <1s startup for native builds)
docker-compose -f docker-compose-validators.yml logs -f validator-1 | grep -E "started|UP|ready" | head -10

# Wait for cluster formation (30-60 seconds)
echo "⏳ Waiting for HyperRAFT++ consensus to form..."
sleep 60
```

### Step 6: Start Business & Slim Nodes

```bash
# Start business nodes (4 containers × 2 nodes = 8 business nodes)
docker-compose -f docker-compose-validators.yml up -d business-1 business-2 business-3 business-4

# Start slim archive nodes (6 containers × 1 node = 6 slim nodes)
docker-compose -f docker-compose-validators.yml up -d slim-1 slim-2 slim-3 slim-4 slim-5 slim-6

# Start load balancer
docker-compose -f docker-compose-validators.yml up -d load-balancer

echo "✅ Full cluster deployment complete"
```

### Step 7: Verify Deployment

```bash
# Check all containers are running
docker-compose -f docker-compose-validators.yml ps

# Expected output:
# NAME                     STATUS              PORTS
# aurigraph-validator-1    Up (healthy)        0.0.0.0:9003→9003/tcp
# aurigraph-validator-2    Up (healthy)        0.0.0.0:9013→9003/tcp
# aurigraph-validator-3    Up (healthy)        0.0.0.0:9023→9003/tcp
# aurigraph-validator-4    Up (healthy)        0.0.0.0:9033→9003/tcp
# ...
```

---

## Verification Procedures

### Health Checks

```bash
# Check Validator-1 HTTP health
curl -s http://localhost:9003/q/health/ready | jq .

# Expected response:
# {
#   "status": "UP",
#   "checks": []
# }

# Check LevelDB health via logs
docker logs aurigraph-validator-1 | grep -i leveldb | tail -5

# Check container health status
docker inspect aurigraph-validator-1 --format='{{json .State.Health}}' | jq .
```

### Consensus Verification

```bash
# Check if consensus is formed (look for HyperRAFT++ messages)
docker logs aurigraph-validator-1 | grep -i "consensus\|raft\|leader" | tail -10

# Expected patterns:
# - "HyperRAFT++ consensus formed"
# - "Leader elected: validator-1a"
# - "Quorum: 9/12 validators confirmed"
```

### Performance Verification

```bash
# Check TPS metrics
curl -s http://localhost:9100/api/v1/query?query=aurigraph_tps_rate | jq .

# Check latency percentiles
curl -s http://localhost:9100/api/v1/query?query=aurigraph_latency_p99 | jq .

# Check block production rate
docker logs aurigraph-validator-1 | grep "blocks produced" | tail -5
```

### Database Verification

```bash
# Check LevelDB size
du -sh docker_validator-1-data/_data/leveldb

# Check LevelDB integrity
docker exec aurigraph-validator-1 test -f /app/data/leveldb/MANIFEST-000001 && echo "✅ LevelDB initialized" || echo "⚠️  LevelDB not yet initialized"

# Check replication across validators
for i in 1 2 3 4; do
  echo "Validator-$i LevelDB:"
  du -sh docker_validator-${i}-data/_data/leveldb
done

# Expected: Similar sizes across all validators (within 5%)
```

---

## Scaling Operations

### Scaling Validators (Horizontal)

To add more validator containers:

```bash
# Create new validator configuration in docker-compose
# - Add new service: validator-5, validator-6, etc.
# - Update AURIGRAPH_CLUSTER_SEEDS in all validators
# - Point seeds to all existing validators

# Restart validators to update cluster topology
docker-compose -f docker-compose-validators.yml restart validator-1 validator-2 validator-3 validator-4
```

### Scaling Business Nodes

```bash
# Add more business nodes by increasing containers or nodes per container
docker-compose -f docker-compose-validators.yml up -d business-5 business-6

# Expected effect: Higher transaction throughput
```

### Scaling Slim Nodes

```bash
# Add more archive nodes for RPC query performance
docker-compose -f docker-compose-validators.yml up -d slim-7 slim-8 slim-9

# Expected effect: Reduced latency for read-heavy queries
```

---

## Monitoring & Dashboards

### Prometheus Metrics

**Validator Health**:
```
aurigraph_consensus_height              # Current block height
aurigraph_tps_rate                      # Current transactions per second
aurigraph_latency_p99                   # 99th percentile latency
aurigraph_node_count                    # Active node count
aurigraph_validator_uptime_seconds      # Node uptime
```

**LevelDB Metrics**:
```
aurigraph_leveldb_size_bytes            # Database size
aurigraph_leveldb_cache_hits            # Cache hit rate
aurigraph_leveldb_compactions_total     # Compaction count
aurigraph_leveldb_seek_latency_ms       # Read latency
aurigraph_leveldb_write_latency_ms      # Write latency
```

### Grafana Dashboards

Access Grafana: **http://localhost:3001**
- Default credentials: admin / admin

**Pre-built Dashboards**:
1. **Validator Overview**: Block height, consensus status, node count
2. **Performance**: TPS, latency percentiles, throughput
3. **LevelDB**: Database size, cache efficiency, compactions
4. **Network**: P2P connections, message throughput, bandwidth
5. **System**: CPU usage, memory, disk I/O, file descriptors

### Jaeger Tracing

Access Jaeger: **http://localhost:16686**

**Traces to Monitor**:
- Block proposal and validation (consensus latency)
- Transaction processing (end-to-end latency)
- State synchronization (sync performance)
- LevelDB operations (database performance)

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs for startup errors
docker logs aurigraph-validator-1 | tail -50

# Common issues:
# - Port already in use: Check `lsof -i :9003`
# - Out of memory: Increase memory limit or reduce nodes per container
# - LevelDB corrupted: Delete volume and restart
```

### Consensus Not Forming

```bash
# Check cluster seeds configuration
docker inspect aurigraph-validator-1 | grep CLUSTER_SEEDS

# Verify network connectivity
docker exec aurigraph-validator-1 ping -c 1 validator-2

# Check for firewall issues
docker exec aurigraph-validator-1 nc -zv validator-2 9004

# If issues persist, restart all validators together
docker-compose -f docker-compose-validators.yml restart
```

### High Latency

```bash
# Check for resource contention
docker stats --no-stream | grep aurigraph

# If CPU or memory is maxed out:
# - Increase resource allocation in docker-compose
# - Reduce number of nodes per container
# - Add more containers/hosts

# Check for LevelDB compactions (normal but impacts latency)
docker logs aurigraph-validator-1 | grep -i compaction

# Monitor network latency between nodes
docker exec aurigraph-validator-1 ping -c 5 validator-2
```

### Database Corruption

```bash
# If LevelDB is corrupted, follow these steps:

# 1. Stop the affected container
docker-compose -f docker-compose-validators.yml stop validator-1

# 2. Backup corrupted data
docker volume inspect docker_validator-1-data
# Copy the _data directory for analysis

# 3. Remove the volume
docker volume rm docker_validator-1-data

# 4. Restart the container (will resync from other validators)
docker-compose -f docker-compose-validators.yml up -d validator-1

# Monitor resyncing
docker logs -f aurigraph-validator-1 | grep -i sync
```

---

## Production Checklist

Before deploying to production, verify:

- [ ] All 12 validators are healthy and consensus is formed
- [ ] All business nodes are synced and responding to queries
- [ ] All slim nodes are in archive mode and indexing blocks
- [ ] LevelDB databases are initialized and accessible
- [ ] Prometheus is collecting metrics from all nodes
- [ ] Grafana dashboards are displaying real-time data
- [ ] HAProxy load balancer is routing traffic correctly
- [ ] Jaeger is collecting distributed traces
- [ ] Backup strategy is in place for LevelDB state
- [ ] Network latency between nodes is <50ms
- [ ] TPS target of 2M+ is achievable (currently 776K+)
- [ ] All security features are enabled (rate limiting, RBAC, JWT rotation)
- [ ] Monitoring alerts are configured
- [ ] Disaster recovery procedures are documented and tested

---

## Performance Tuning

### For Higher TPS

```yaml
# In docker-compose-validators.yml, adjust:
deploy:
  resources:
    limits:
      cpus: '16'        # Increase CPUs
      memory: 1024M     # Increase memory

# Also adjust in Dockerfile.native:
LEVELDB_CACHE_SIZE: "1024m"
LEVELDB_WRITE_BUFFER_SIZE: "128m"
```

### For Lower Latency

```yaml
# Reduce batch sizes and increase parallelism
AURIGRAPH_BATCH_SIZE: "1000"  # Default 50000, reduce for lower latency
AURIGRAPH_THREAD_POOL_SIZE: "512"  # Increase parallelism
```

### For Lower Memory

```yaml
deploy:
  resources:
    limits:
      memory: 256M    # Native mode can run at 256MB

# In Dockerfile.native:
LEVELDB_CACHE_SIZE: "128m"    # Reduce cache size
LEVELDB_WRITE_BUFFER_SIZE: "32m"
```

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor container health and resource usage
- Check for disk space issues
- Review error logs

**Weekly**:
- Verify consensus is stable
- Check replication across validators
- Review performance metrics

**Monthly**:
- LevelDB compaction verification
- Backup completeness verification
- Performance trend analysis

### Upgrades

```bash
# To deploy a new version:

# 1. Build new native image
docker build -t aurigraph/v11-native:v11.5.0 \
  --build-arg BUILD_PROFILE=native-ultra \
  -f Dockerfile.native .

# 2. Update docker-compose to use new image tag

# 3. Rolling update (one validator at a time)
docker-compose -f docker-compose-validators.yml up -d --no-deps --build validator-1
sleep 60  # Wait for consensus to stabilize
docker-compose -f docker-compose-validators.yml up -d --no-deps --build validator-2
# Repeat for validator-3 and validator-4
```

---

## Support

For issues or questions:

1. Check logs: `docker logs aurigraph-validator-1`
2. Review metrics in Grafana: http://localhost:3001
3. Check traces in Jaeger: http://localhost:16686
4. See deployment guide: [PLATFORM-KNOWLEDGE-TRANSFER-J4C.md](PLATFORM-KNOWLEDGE-TRANSFER-J4C.md)
5. GitHub Issues: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

---

**Last Updated**: November 11, 2025
**Maintainer**: Aurigraph Development Team
**Status**: Production Ready ✅

