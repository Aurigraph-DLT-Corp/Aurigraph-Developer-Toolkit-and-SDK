# Aurigraph V11 - Sprint 3: Production Deployment Checklist

## JIRA Tickets Covered
- **AV11-66**: Production Deployment (8 points)
- **AV11-67**: V11 Demo: WebSocket Real-time Streaming
- **AV11-68**: V11 Demo: Transaction Generation Engine
- **AV11-69**: V11 Demo: Performance Metrics Collection
- **AV11-70**: V11 Demo: Deploy to Production
- **AV11-71**: V11 Demo: Create User Documentation
- **AV11-72**: V11 Demo: Performance Benchmarking Suite
- **AV11-171**: V3.6: Production Deployment to dlt.aurigraph.io

---

## Deployment Target
- **Server**: dlt.aurigraph.io
- **SSH Access**: `ssh -p22 subbu@dlt.aurigraph.io`
- **Deploy Folder**: `/opt/DLT`
- **Domain**: dlt.aurigraph.io
- **Ports**: 80 (HTTP redirect), 443 (HTTPS)

---

## Pre-Deployment Checklist

### 1. Build Artifacts Verification
- [ ] JAR file exists: `target/aurigraph-v11-standalone-*-runner.jar`
- [ ] Native executable built (if using native profile)
- [ ] Enterprise Portal built: `enterprise-portal/dist/`
- [ ] Docker images tagged and ready

### 2. Configuration Files Ready
- [ ] `docker-compose.yml` - Base configuration
- [ ] `docker-compose.prod.yml` - Production overrides (6 node types)
- [ ] `docker-compose.monitoring.yml` - Prometheus, Grafana, AlertManager
- [ ] NGINX configuration with SSL settings
- [ ] Prometheus configuration (`deployment/prometheus.yml`)
- [ ] AlertManager configuration (`deployment/alertmanager.yml`)

### 3. SSL/TLS Certificates
- [ ] SSL Certificate: `/etc/letsencrypt/live/aurcrt/fullchain.pem`
- [ ] SSL Private Key: `/etc/letsencrypt/live/aurcrt/privkey.pem`
- [ ] Certificate expiry > 30 days

### 4. Environment Variables
```bash
DB_PASSWORD=<secure-password>
GRAFANA_PASSWORD=<secure-password>
DOMAIN=dlt.aurigraph.io
QUARKUS_PROFILE=prod
CONSENSUS_TARGET_TPS=2000000
AI_OPTIMIZATION_ENABLED=true
QUANTUM_CRYPTO_ENABLED=true
```

---

## Deployment Steps

### Phase 1: Pre-Deployment Validation
```bash
# Verify JAR exists
ls -la target/aurigraph-v11-standalone-*-runner.jar

# Verify Docker Compose files
docker-compose -f docker-compose.yml config
docker-compose -f docker-compose.prod.yml config

# Verify Enterprise Portal build
ls -la enterprise-portal/dist/
```

### Phase 2: Remote Environment Preparation
```bash
# Connect to server
ssh -p22 subbu@dlt.aurigraph.io

# Stop existing containers
docker stop $(docker ps -q)
docker rm $(docker ps -a -q)

# Clean volumes (CAUTION: data loss)
docker volume prune -f

# Prepare deployment directory
mkdir -p /opt/DLT/{data,logs,ssl,html,config}
```

### Phase 3: File Transfer
```bash
# From local machine
scp -P22 target/aurigraph-v11-standalone-*-runner.jar subbu@dlt.aurigraph.io:/opt/DLT/
scp -P22 docker-compose.yml subbu@dlt.aurigraph.io:/opt/DLT/
scp -P22 docker-compose.prod.yml subbu@dlt.aurigraph.io:/opt/DLT/
scp -r -P22 enterprise-portal/dist/* subbu@dlt.aurigraph.io:/opt/DLT/html/
scp -P22 deployment/prometheus.yml subbu@dlt.aurigraph.io:/opt/DLT/config/
scp -P22 deployment/alertmanager.yml subbu@dlt.aurigraph.io:/opt/DLT/config/
```

### Phase 4: Docker Deployment
```bash
# On remote server
cd /opt/DLT

# Copy SSL certificates
cp /etc/letsencrypt/live/aurcrt/fullchain.pem /opt/DLT/ssl/
cp /etc/letsencrypt/live/aurcrt/privkey.pem /opt/DLT/ssl/

# Build and start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to start
sleep 30

# Verify containers are running
docker-compose ps
```

### Phase 5: Health Verification
```bash
# Test local health endpoint
curl -s http://localhost:9003/q/health

# Test API endpoints
curl -s http://localhost:9003/api/v11/info

# Test HTTPS endpoint
curl -s https://dlt.aurigraph.io/api/v11/health

# Check container logs
docker-compose logs --tail=50
```

### Phase 6: Monitoring Setup
```bash
# Verify Prometheus is scraping metrics
curl -s http://localhost:9090/api/v1/targets

# Verify Grafana is accessible
curl -s http://localhost:3000/api/health

# Test AlertManager
curl -s http://localhost:9093/-/healthy
```

---

## Docker Services Summary

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| Aurigraph V11 | aurigraph-v11-native | 9003, 9004 | Main DLT Application |
| Validator Node 1 | validator-node-1 | 9003 | Transaction Validation |
| Validator Node 2 | validator-node-2 | 9005 | Transaction Validation |
| Business Node 1 | business-node-1 | 9020 | Smart Contracts |
| Business Node 2 | business-node-2 | 9021 | Smart Contracts |
| Integration Node 1 | integration-node-1 | 9040 | External APIs |
| Integration Node 2 | integration-node-2 | 9041 | External APIs |
| PostgreSQL | aurigraph-postgres | 5432 | Database |
| Redis | aurigraph-redis | 6379 | Cache |
| Prometheus | aurigraph-prometheus | 9090 | Metrics Collection |
| Grafana | aurigraph-grafana | 3000 | Visualization |
| AlertManager | aurigraph-alertmanager | 9093 | Alert Management |
| NGINX | aurigraph-nginx | 80, 443 | Reverse Proxy |
| Consul | aurigraph-consul | 8500 | Service Discovery |
| Vault | aurigraph-vault | 8200 | Secrets Management |

---

## Production URLs

| Endpoint | URL |
|----------|-----|
| Enterprise Portal | https://dlt.aurigraph.io |
| Backend API | https://dlt.aurigraph.io/api/v11/ |
| Health Check | https://dlt.aurigraph.io/q/health |
| Metrics | https://dlt.aurigraph.io/q/metrics |
| Prometheus | http://dlt.aurigraph.io:9090 |
| Grafana | http://dlt.aurigraph.io:3000 |
| AlertManager | http://dlt.aurigraph.io:9093 |

---

## Rollback Procedure

```bash
# Stop current deployment
docker-compose down

# Restore from backup (if available)
docker volume restore <volume-name> <backup-file>

# Deploy previous version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify rollback
curl -s http://localhost:9003/q/health
```

---

## Monitoring Alert Rules (25 rules configured)

### Critical Alerts (5)
1. AurigraphServiceDown - Service unavailable for > 1 minute
2. CPUCriticalUsage - CPU > 90% for 5 minutes
3. MemoryCriticalUsage - Memory > 90% for 5 minutes
4. DiskCriticalUsage - Disk > 95% for 2 minutes
5. ConsensusFailure - HyperRAFT++ failure detected

### High Priority Alerts (10)
6. LowTransactionsPerSecond - TPS < 100K for 10 minutes
7. HighLatencyP99 - P99 latency > 500ms
8. HighErrorRate - Error rate > 1%
9. TransactionQueueBacklog - Queue > 100K pending
10. BridgeTransactionStuck - Bridge tx pending > 1 hour
11. ConsensusTimeout - Consensus timeouts detected
12. LeaderElectionFailure - Frequent leader changes
13. NetworkPartitionDetected - Node count mismatch
14. QuantumSignatureFailure - Crypto verification failures
15. HighInvalidTransactionRate - Invalid tx > 5%

### Medium Priority Alerts (5)
16. ElevatedCPUUsage - CPU > 75% for 15 minutes
17. ElevatedMemoryUsage - Memory > 75% for 15 minutes
18. ElevatedDiskUsage - Disk > 80% for 10 minutes
19. ReducedTransactionsPerSecond - TPS < 500K for 30 minutes
20. ElevatedResponseTimeP95 - P95 latency > 200ms

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| TPS | 2,000,000+ | 776,000 |
| P99 Latency | < 500ms | TBD |
| Startup Time (Native) | < 1s | < 1s |
| Memory (Native) | < 256MB | < 256MB |
| Error Rate | < 0.1% | TBD |

---

## Demo Environment Requirements

### AV11-67: WebSocket Real-time Streaming
- [ ] WebSocket endpoint available at `/ws/stream`
- [ ] Real-time transaction updates streaming
- [ ] Connection pooling configured

### AV11-68: Transaction Generation Engine
- [ ] Transaction generator API enabled
- [ ] Configurable TPS rates (1K, 10K, 100K, 1M)
- [ ] Transaction types: TRANSFER, STAKE, BRIDGE, CONTRACT

### AV11-69: Performance Metrics Collection
- [ ] Prometheus metrics exposed at `/q/metrics`
- [ ] Custom Aurigraph metrics available
- [ ] Grafana dashboards deployed

### AV11-72: Performance Benchmarking Suite
- [ ] `demo-performance-tests.sh` ready
- [ ] 21 performance test scenarios
- [ ] Report generation enabled

---

## Useful Commands

```bash
# Check all container status
docker-compose ps

# View logs for specific service
docker-compose logs -f aurigraph-v11-native

# Restart a specific service
docker-compose restart aurigraph-v11-native

# Scale validators (if needed)
docker-compose up -d --scale validator-node=5

# Check resource usage
docker stats --no-stream

# Database access
docker-compose exec postgres psql -U aurigraph -d aurigraph

# Redis CLI
docker-compose exec redis redis-cli
```

---

## Post-Deployment Validation

- [ ] Enterprise Portal loads at https://dlt.aurigraph.io
- [ ] API endpoints return valid responses
- [ ] Health endpoints return UP status
- [ ] Metrics are being collected by Prometheus
- [ ] Grafana dashboards show data
- [ ] SSL certificate is valid (check in browser)
- [ ] WebSocket streaming works (demo page)
- [ ] Transaction generation engine works
- [ ] Performance benchmarks pass

---

## Document Version
- **Created**: 2025-12-20
- **Sprint**: Sprint 3 - Production Deployment & Demo
- **Author**: DevOps & Deployment Agent (DDA)
