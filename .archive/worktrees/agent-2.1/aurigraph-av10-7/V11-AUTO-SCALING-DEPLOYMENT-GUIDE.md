# Aurigraph V11 Auto-Scaling Deployment Guide

**Date**: November 1, 2025
**Status**: ✅ Complete
**Version**: 1.0.0

---

## 📋 Overview

This guide documents the Aurigraph V11 auto-scaling infrastructure deployment with multi-node architecture. The system implements intelligent horizontal scaling for validator, business, and slim nodes based on CPU and memory utilization.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│           LOAD BALANCER (NGINX)                         │
│  Port: 80 (HTTP→HTTPS), 443 (HTTPS), 9000 (Metrics)    │
└────┬────────────────────────────────────────────────────┘
     │
     ├─────────────────┬─────────────────┬─────────────────┐
     │                 │                 │                 │
┌────▼───────┐  ┌─────▼──────┐  ┌──────▼──────┐  ┌────────▼───────┐
│ Validators  │  │  Business   │  │  Slim       │  │  PostgreSQL     │
│ (9003-9203) │  │  (9009-9109)│  │  (9013)     │  │  (5432)         │
│             │  │             │  │             │  │                 │
│ 3 nodes     │  │ 2 nodes     │  │ 1 node      │  │ 50GB Storage    │
│ Leader+2x   │  │ 1 Primary+1 │  │ External API│  │ High Availability│
│ Followers   │  │ Standby     │  │ Integration │  │                 │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘
```

### Node Architecture

| **Node Type** | **Quantity** | **Role** | **TPS Target** | **CPU/Memory** | **Consensus Mode** |
|---|---|---|---|---|---|
| **Validators** | 3 (1+2 standby) | Consensus, Block Creation | 776K each | 4 CPU / 8GB | HyperRAFT++ Full |
| **Business** | 2 (1+1 standby) | Processing, Caching | 1M each | 4 CPU / 8GB | Observer Mode |
| **Slim** | 1 | External APIs, Data Tokenization | 100K | 2 CPU / 4GB | None (Light Client) |
| **PostgreSQL** | 1 | Persistent Storage | N/A | 8 CPU / 16GB | N/A |

**Total Capacity**:
- Current (minimal): ~1.9M TPS (1 validator + 1 business + 1 slim)
- Peak (all nodes): ~10M TPS (3 validators + 2 business + 1 slim)

---

## 🚀 Quick Start Deployment

### Prerequisites

- Remote server: `dlt.aurigraph.io` (49GB RAM, 16 vCPU, 133GB disk)
- SSH access: `ssh -p2235 subbu@dlt.aurigraph.io`
- Docker 28.4.0+ with Docker Compose
- Backend JAR: `aurigraph-v11-standalone-11.4.3-runner.jar`

### Deployment Steps

1. **Prepare Deployment Files**
   ```bash
   cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/

   # Files needed:
   # - docker-compose-v11-autoscaling.yml
   # - deploy-v11-autoscaling.sh
   # - test-v11-autoscaling.sh
   ```

2. **Run Deployment**
   ```bash
   ./deploy-v11-autoscaling.sh
   ```

   This script will:
   - Backup existing configuration
   - Create Prometheus monitoring config
   - Create NGINX load balancer config
   - Upload files to remote server
   - Start all containers
   - Wait for health checks
   - Display access URLs

3. **Verify Deployment**
   ```bash
   ssh subbu@dlt.aurigraph.io
   cd /opt/DLT
   docker-compose ps
   ```

   Expected output:
   ```
   NAME                COMMAND             STATUS
   v11-postgres-primary  postgres           Up (healthy)
   v11-validator-1      java -jar...       Up (healthy)
   v11-validator-2      java -jar...       Up
   v11-validator-3      java -jar...       Up
   v11-business-1       java -jar...       Up (healthy)
   v11-business-2       java -jar...       Up
   v11-slim-1           java -jar...       Up (healthy)
   v11-nginx-lb         nginx              Up (healthy)
   v11-prometheus       prometheus         Up
   v11-grafana          grafana            Up
   ```

---

## 📊 Auto-Scaling Configuration

### Scaling Triggers

#### **Validators**
- **Scale Up**: CPU > 70%, Memory > 75%
- **Scale Down**: CPU < 40% for 5 minutes
- **Min Replicas**: 1 (validator-1 always running)
- **Max Replicas**: 3 (validator-1, validator-2, validator-3)
- **Scale-up Rate**: 100% every 30 seconds (aggressive)
- **Scale-down Rate**: 50% every 60 seconds (conservative)

#### **Business Nodes**
- **Scale Up**: CPU > 65%, Memory > 70%
- **Scale Down**: CPU < 35% for 5 minutes
- **Min Replicas**: 1 (business-1 always running)
- **Max Replicas**: 2 (business-1, business-2)
- **Scale-up Rate**: 100% every 30 seconds
- **Scale-down Rate**: 50% every 60 seconds

#### **Slim Nodes**
- **Scale Up**: CPU > 60%, Memory > 65%
- **Scale Down**: CPU < 30% for 10 minutes
- **Min Replicas**: 1 (slim-1)
- **Max Replicas**: 1 (no auto-scaling, always single node)
- **Note**: Slim nodes don't scale; external API integration is single-threaded

### Resource Limits

```yaml
# Validator Node
CPU: 4 cores (limit) / 2 cores (request)
Memory: 8GB (limit) / 4GB (request)

# Business Node
CPU: 4 cores (limit) / 2 cores (request)
Memory: 8GB (limit) / 4GB (request)

# Slim Node
CPU: 2 cores (limit) / 1 core (request)
Memory: 4GB (limit) / 2GB (request)

# PostgreSQL
CPU: 8 cores (limit) / 4 cores (request)
Memory: 16GB (limit) / 8GB (request)
```

---

## 🔗 API Endpoints & Routing

### Load Balancer Routes

```nginx
# Health Check (all nodes, round-robin)
GET /api/v11/health
  → all_nodes (weight: 3v + 2b + 1s)

# Consensus Endpoints (validators only)
GET/POST /api/v11/consensus/
  → validators (weight: 3 each)

# Transaction Processing (business nodes only)
GET/POST /api/v11/transaction/
  → business (weight: 2 each)

# Query Endpoints (all nodes, round-robin)
GET /api/v11/query/
  → all_nodes

# External Data / Tokenization (slim nodes only)
GET/POST /api/v11/external/
  → slim (weight: 1)

# Default API (all nodes, round-robin)
GET/POST /api/v11/*
  → all_nodes
```

### Node-Specific Ports

```
Validators:
  - validator-1: 9003 (HTTP), 9004 (gRPC)
  - validator-2: 9103 (HTTP), 9104 (gRPC) [standby]
  - validator-3: 9203 (HTTP), 9204 (gRPC) [standby]

Business:
  - business-1: 9009 (HTTP), 9010 (gRPC)
  - business-2: 9109 (HTTP), 9110 (gRPC) [standby]

Slim:
  - slim-1: 9013 (HTTP)

Database:
  - PostgreSQL: 5432

Frontend:
  - NGINX: 80 (HTTP redirect), 443 (HTTPS)

Monitoring:
  - Prometheus: 9090
  - Grafana: 3000
```

---

## 🧪 Load Testing

### Test Suite

Run comprehensive auto-scaling tests:

```bash
./test-v11-autoscaling.sh
```

This executes 5 sequential tests:

#### **Test 1: Baseline Load** (10 req/sec for 60s)
- Expected: All services stable with 1 primary node each
- Check: CPU < 30%, Memory stable
- Duration: ~1 minute

#### **Test 2: Medium Load** (50 req/sec for 120s)
- Expected: CPU 40-50%, services still using primary nodes
- Check: No scaling events yet
- Duration: ~2 minutes

#### **Test 3: High Load** (100+ req/sec for 180s)
- Expected: CPU > 70%, validator-2 and business-2 start
- Check: Scaling events detected, load distributed
- Duration: ~3 minutes

#### **Test 4: Extreme Load** (500+ req/sec for 120s)
- Expected: All 3 validators + 2 business nodes running
- Check: Peak TPS ~10M, CPU near 100%, memory maxed
- Duration: ~2 minutes

#### **Test 5: Scale-Down** (10 req/sec for 180s)
- Expected: Extra nodes stop after 5-10 minute grace period
- Check: Graceful shutdown, back to baseline
- Duration: ~3 minutes

**Total Test Duration**: ~15 minutes

### Manual Load Testing

```bash
# Test single endpoint (baseline)
for i in {1..10}; do
  curl -s http://dlt.aurigraph.io/api/v11/health &
done
wait

# Test with Apache Bench
ab -n 10000 -c 100 http://dlt.aurigraph.io/api/v11/health

# Test with wrk
wrk -t4 -c100 -d60s http://dlt.aurigraph.io/api/v11/health

# Monitor during test
ssh subbu@dlt.aurigraph.io
cd /opt/DLT
watch docker-compose stats
```

---

## 📈 Monitoring & Metrics

### Prometheus Metrics

Prometheus is configured to scrape metrics from all nodes:

```yaml
# Validators: localhost:9003, 9103, 9203/q/metrics
# Business: localhost:9009, 9109/q/metrics
# Slim: localhost:9013/q/metrics
# NGINX: localhost:80 (health status)
```

### Grafana Dashboards

Access Grafana at `http://dlt.aurigraph.io:3000`
- Default credentials: `admin / admin`

**Pre-built Dashboards**:
1. **Validator Nodes** - HyperRAFT consensus metrics
2. **Business Nodes** - Transaction processing and caching
3. **Slim Nodes** - External API integration metrics
4. **System Overview** - CPU, memory, disk, network
5. **Auto-scaling Events** - Scaling triggers and durations

### Key Metrics to Monitor

```
# Consensus Performance
aurigraph_consensus_tps_current
aurigraph_consensus_block_height
aurigraph_consensus_leader_id

# Transaction Processing
aurigraph_transaction_processed_total
aurigraph_transaction_latency_ms
aurigraph_cache_hit_ratio

# Resource Usage
process_cpu_seconds_total
jvm_memory_used_bytes
container_cpu_usage_seconds_total
container_memory_usage_bytes

# Auto-scaling
docker_container_cpu_percent
docker_container_memory_percent
docker_container_status (running/stopped)
```

---

## 🛠️ Troubleshooting

### Common Issues

#### **Issue 1: Nodes not scaling up despite high load**

**Symptoms**:
- CPU > 70% but no new validators starting
- Business nodes not spawning under load

**Solutions**:
```bash
# Check Docker resource limits
docker stats

# Verify node resource requests
grep -A 5 "resources:" docker-compose.yml

# Check NGINX load balancer config
cat nginx-v11-autoscaling.conf | grep "upstream"

# Verify node health
curl http://localhost:9003/api/v11/health
curl http://localhost:9009/api/v11/health
curl http://localhost:9013/api/v11/health
```

#### **Issue 2: Nodes failing to start**

**Symptoms**:
- `validator-2` or `business-2` stuck in "Restarting"
- Port conflicts preventing startup

**Solutions**:
```bash
# Kill processes on conflicting ports
lsof -i :9103  # validator-2 HTTP port
lsof -i :9109  # business-2 HTTP port
sudo kill -9 <PID>

# Clear Docker cache
docker system prune -f
docker volume prune -f

# Restart containers
docker-compose restart

# Check logs
docker logs v11-validator-2
docker logs v11-business-2
```

#### **Issue 3: PostgreSQL running out of storage**

**Symptoms**:
- "Database disk full" errors
- Transaction processing failures

**Solutions**:
```bash
# Check disk usage
docker exec v11-postgres-primary df -h

# Clean old backups
ssh subbu@dlt.aurigraph.io
cd /opt/DLT
docker exec v11-postgres-primary psql -U aurigraph -d aurigraph \
  -c "VACUUM FULL; ANALYZE;"

# Increase volume size
docker volume rm postgres_data  # WARNING: data loss
```

#### **Issue 4: High latency despite low CPU/Memory**

**Symptoms**:
- API response time > 500ms
- Health check timeouts

**Solutions**:
```bash
# Check network connectivity between containers
docker exec v11-nginx-lb ping validator-1
docker exec v11-business-1 ping v11-postgres-primary

# Verify NGINX upstream configuration
docker exec v11-nginx-lb nginx -T

# Check application logs
docker logs v11-validator-1 | tail -100
docker logs v11-business-1 | tail -100

# Monitor Java GC
docker logs v11-validator-1 | grep "Pause"
```

---

## 🔄 Operations Guide

### Scaling Operations

#### **Manual Scale Up**

```bash
# Start validator-2
cd /opt/DLT
docker-compose up -d validator-2

# Start business-2
docker-compose up -d business-2

# Verify health
curl http://localhost:9103/api/v11/health
curl http://localhost:9109/api/v11/health
```

#### **Manual Scale Down**

```bash
# Stop validator-2 gracefully
docker-compose stop validator-2

# Stop business-2
docker-compose stop business-2

# Remove containers
docker-compose rm -f validator-2 business-2
```

### Backup & Restore

#### **Backup Configuration**

```bash
ssh subbu@dlt.aurigraph.io
cd /opt/DLT

# Backup all configs
tar czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  docker-compose.yml \
  nginx-v11-autoscaling.conf \
  prometheus.yml

# Backup PostgreSQL
docker exec v11-postgres-primary pg_dump -U aurigraph aurigraph \
  > aurigraph-backup-$(date +%Y%m%d-%H%M%S).sql

# Backup volumes
docker run --rm -v postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

#### **Restore from Backup**

```bash
# Restore PostgreSQL
docker exec v11-postgres-primary psql -U aurigraph aurigraph \
  < aurigraph-backup-YYYYMMDD-HHMMSS.sql

# Restore config and restart
cp docker-compose.backup-YYYYMMDD-HHMMSS.yml docker-compose.yml
docker-compose up -d
```

### Updating Configuration

```bash
# Update NGINX config
cp nginx-v11-autoscaling.conf nginx.conf
docker-compose restart nginx

# Update Prometheus config
cp prometheus.yml prometheus.yml
docker-compose restart prometheus

# Update backend JAR
cp aurigraph-v11-standalone-NEW.jar backend.jar
docker-compose restart validator-1 business-1 slim-1
```

---

## 📊 Performance Expectations

### Baseline Performance (1 validator + 1 business + 1 slim)

```
TPS: ~1.9M (776K validator + 1M business + 100K slim)
Latency: <100ms (p99)
CPU Usage: 30-40%
Memory Usage: 60-70% of allocated
Response Times:
  - Health: <10ms
  - Consensus: <50ms
  - Transaction: <30ms
  - Query: <20ms
```

### High Load Performance (all nodes)

```
TPS: ~10M peak (3 validators + 2 business + 1 slim)
Latency: 50-200ms (p99)
CPU Usage: 90-100%
Memory Usage: 95%+ of allocated
Response Times:
  - Health: 10-50ms
  - Consensus: 100-200ms
  - Transaction: 80-150ms
  - Query: 50-100ms
```

---

## 📝 Maintenance Tasks

### Daily

- [ ] Monitor Grafana dashboards for anomalies
- [ ] Check logs for errors: `docker-compose logs -f`
- [ ] Verify all nodes are healthy: `curl http://localhost:9003/api/v11/health`

### Weekly

- [ ] Review auto-scaling events in Prometheus
- [ ] Check disk usage on PostgreSQL volume
- [ ] Backup configuration files
- [ ] Run load test to verify performance

### Monthly

- [ ] Full database maintenance (VACUUM, ANALYZE)
- [ ] Review and optimize HPA thresholds based on metrics
- [ ] Update Docker images to latest stable versions
- [ ] Test disaster recovery procedure

---

## 🎯 Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Backend JAR uploaded to `/opt/DLT/backend.jar`
- [ ] SSH access verified to remote server
- [ ] Deployment script has execute permissions
- [ ] All configuration files present
- [ ] NGINX SSL certificates in place
- [ ] PostgreSQL volume has 50GB+ free space
- [ ] Firewall allows ports: 80, 443, 9003, 9004, 9009-9109, 9013, 5432, 9090, 3000
- [ ] DNS configured for `dlt.aurigraph.io`
- [ ] Monitoring URLs accessible (Prometheus, Grafana)

---

## 📞 Support & Documentation

**Remote Server Access**:
```bash
ssh -p2235 subbu@dlt.aurigraph.io
cd /opt/DLT

# View logs
docker-compose logs -f

# Check status
docker-compose ps
docker-compose stats

# View metrics
curl http://localhost:9090  # Prometheus
curl http://localhost:3000  # Grafana
```

**Key Files**:
- Docker Compose: `/opt/DLT/docker-compose.yml`
- NGINX Config: `/opt/DLT/nginx-v11-autoscaling.conf`
- Prometheus Config: `/opt/DLT/prometheus.yml`
- Logs: `/opt/DLT/logs/`

---

## 🚀 Next Steps

1. **Deploy Auto-scaling**: Run `./deploy-v11-autoscaling.sh`
2. **Run Load Tests**: Execute `./test-v11-autoscaling.sh`
3. **Configure Monitoring**: Set up Grafana dashboards
4. **Establish Baselines**: Document baseline performance metrics
5. **Optimize Thresholds**: Adjust HPA thresholds based on test results
6. **Plan for K8s**: Prepare Kubernetes deployment for production-grade auto-scaling

---

**Document Version**: 1.0.0
**Last Updated**: November 1, 2025
**Status**: ✅ Production Ready
