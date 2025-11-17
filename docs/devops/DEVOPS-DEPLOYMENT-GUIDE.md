# Aurigraph DLT - DevOps Deployment Guide

**Version**: 1.0.0
**Last Updated**: November 17, 2025
**Status**: Production-Ready
**Maintainers**: DevOps Team, Infrastructure Engineering

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Architectures](#deployment-architectures)
3. [Infrastructure Prerequisites](#infrastructure-prerequisites)
4. [Docker Compose Deployment](#docker-compose-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Network Configuration](#network-configuration)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Observability](#monitoring--observability)
9. [Scaling Strategies](#scaling-strategies)
10. [Disaster Recovery](#disaster-recovery)
11. [Performance Tuning](#performance-tuning)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Philosophy

Aurigraph DLT supports multiple deployment architectures optimized for different operational scales:

- **Development**: Minimal footprint, fast iteration, integrated tooling
- **Staging**: Production-like, comprehensive testing, full observability
- **Production**: High availability, disaster recovery, multi-cloud federation
- **Edge**: Resource-constrained, validator-only, optimized footprint

### Key Characteristics

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| **Services** | 8-12 | 18-22 | 24+ |
| **Startup Time** | 5-8 min | 12-15 min | 15-20 min |
| **HA Mode** | Single instance | Multi-replica | Multi-zone |
| **Backup Frequency** | Manual | Hourly | Every 15 min |
| **Monitoring** | Basic | Comprehensive | Enterprise |
| **Cost/Month** | $200-500 | $1000-2000 | $5000-10000 |

---

## Deployment Architectures

### 1. Development Minimal (Docker Compose)

**Use Case**: Local development, feature testing, rapid prototyping

**Services**: 8 essential services
**Hardware**: 4 CPU, 8GB RAM, 50GB storage
**Startup**: ~5 minutes

```bash
cd deployment
docker-compose -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.blockchain.yml up -d
```

**Included Services**:
- PostgreSQL (transactions)
- Redis (session cache)
- V11 API service
- Single validator node

**Excluded Services**:
- Monitoring (Prometheus/Grafana)
- Logging aggregation
- Storage (MinIO)
- Advanced caching (Hazelcast)

---

### 2. Full Development (Docker Compose)

**Use Case**: Complete feature development, integration testing, simulation

**Services**: 18-20 services
**Hardware**: 8 CPU, 16GB RAM, 100GB storage
**Startup**: ~12 minutes

```bash
cd deployment
docker-compose -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.storage.yml \
  -f docker-compose.blockchain.yml \
  -f docker-compose.monitoring.yml \
  -f docker-compose.logging.yml up -d
```

**Added Services** vs. Minimal:
- 3-node validator cluster (BFT consensus testing)
- MinIO object storage
- Prometheus metrics collection
- Grafana dashboards
- Elasticsearch/Logstash/Kibana
- AlertManager (alert routing)

---

### 3. Production Multi-Cloud (Kubernetes)

**Use Case**: Enterprise deployment, high availability, disaster recovery

**Services**: 24+ with replication
**Hardware**: 12+ nodes, 4+ CPU each, 200GB+ storage
**Startup**: ~20 minutes (initial)

**Deployment**: Kubernetes manifests with Helm charts

```bash
# Install with Helm
helm install aurigraph ./helm/aurigraph \
  --namespace aurigraph \
  --values values-production.yml
```

**Architecture**:
- AWS: us-east-1 (4 validators, 6 business, 12 slim)
- Azure: eastus (4 validators, 6 business, 12 slim)
- GCP: us-central1 (4 validators, 6 business, 12 slim)
- WireGuard VPN mesh for inter-cloud communication
- GeoDNS for global load balancing

---

### 4. Testing Isolated Network

**Use Case**: Staging validation, QA testing, integration tests

**Services**: 5-7 lightweight services
**Hardware**: 4 CPU, 8GB RAM, 50GB storage
**Startup**: ~3 minutes

```bash
cd deployment
docker-compose -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.blockchain.yml \
  -f docker-compose-test.yml up -d
```

---

## Infrastructure Prerequisites

### System Requirements

#### Minimum (Development)
```
CPU:     4 cores (Intel/ARM)
RAM:     8GB
Storage: 50GB (SSD recommended)
Network: 1Gbps
OS:      Linux (Ubuntu 22.04+), macOS 12+, Windows 11 (WSL2)
```

#### Recommended (Staging)
```
CPU:     8 cores (Intel/ARM 64-bit)
RAM:     16GB
Storage: 100GB NVMe
Network: 10Gbps
OS:      Linux (Ubuntu 22.04 LTS)
Kernel:  5.15+ (for eBPF features)
```

#### Enterprise (Production)
```
CPU:     12+ cores per node
RAM:     32GB+ per node
Storage: 500GB+ NVMe
Network: 100Gbps (inter-cloud), 10Gbps (zone-local)
OS:      Linux (Ubuntu 22.04 LTS) or RHEL 8+
Kernel:  5.15+ with CONFIG_BPF enabled
```

### Software Dependencies

#### Core Requirements
```bash
# Docker & Docker Compose
docker --version        # 24.0+
docker-compose --version # 2.20+

# Kubernetes (production only)
kubectl version --client # 1.28+
helm version            # 3.12+

# Development Tools
java --version          # OpenJDK 21+
git --version          # 2.40+
```

#### Optional Tools
```bash
# Monitoring & Management
prometheus --version    # 2.45+
grafana-cli --version  # 10.0+

# Infrastructure as Code
terraform --version    # 1.5+
ansible --version      # 2.15+

# Container Registry
podman --version       # Optional, Docker alternative
```

---

## Docker Compose Deployment

### Quick Start (5 minutes)

#### 1. Clone Repository
```bash
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT
```

#### 2. Configure Environment
```bash
# Copy environment template
cp deployment/.env.example deployment/.env

# Edit configuration
nano deployment/.env

# Required variables:
# DB_USER=aurigraph
# DB_PASSWORD=<secure-password>
# REDIS_PASSWORD=<secure-password>
# GRAFANA_USER=admin
# GRAFANA_PASSWORD=<secure-password>
```

#### 3. Create Networks
```bash
# Pre-create networks for explicit management
docker network create aurigraph-frontend --subnet=10.1.0.0/24
docker network create aurigraph-backend --subnet=10.2.0.0/24
docker network create aurigraph-monitoring --subnet=10.3.0.0/24
docker network create aurigraph-logging --subnet=10.4.0.0/24
```

#### 4. Start Services
```bash
cd deployment

# Development Minimal (8 services)
docker-compose -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.blockchain.yml up -d

# OR Full Development (18+ services)
docker-compose -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.storage.yml \
  -f docker-compose.blockchain.yml \
  -f docker-compose.monitoring.yml up -d
```

#### 5. Verify Deployment
```bash
# Check service status
docker-compose ps

# Check health endpoints
curl http://localhost:9003/q/health        # V11 API
curl http://localhost:5432/               # PostgreSQL
curl http://localhost:3000/api/health      # Grafana
```

### File Organization & Composition

#### Module Structure
```
deployment/
├── docker-compose.base.yml              # Networks, volumes, anchors
├── docker-compose.database.yml          # PostgreSQL, MongoDB, Flyway
├── docker-compose.cache.yml             # Redis, Hazelcast
├── docker-compose.storage.yml           # MinIO
├── docker-compose.blockchain.yml        # API Gateway, V11, validators
├── docker-compose.monitoring.yml        # Prometheus, Grafana, AlertManager
├── docker-compose.logging.yml           # Elasticsearch, Logstash, Kibana
├── docker-compose.tracing.yml           # Jaeger distributed tracing
├── docker-compose.iam.yml               # Keycloak identity management
├── docker-compose.messaging.yml         # RabbitMQ, Kafka
├── docker-compose.contracts.yml         # Smart contract services
├── docker-compose.analytics.yml         # Analytics and reporting
└── overrides/
    ├── docker-compose.dev.yml           # Development overrides
    ├── docker-compose.staging.yml       # Staging overrides
    ├── docker-compose.prod.yml          # Production overrides
    └── docker-compose.test.yml          # Testing overrides
```

#### Composition Examples

**Development Minimal**:
```bash
docker-compose \
  -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.blockchain.yml \
  -f overrides/docker-compose.dev.yml \
  up -d
```

**Staging Full**:
```bash
docker-compose \
  -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.storage.yml \
  -f docker-compose.blockchain.yml \
  -f docker-compose.monitoring.yml \
  -f docker-compose.logging.yml \
  -f overrides/docker-compose.staging.yml \
  up -d
```

**Production Multi-Zone**:
```bash
# Use kubernetes instead (see next section)
```

### Operational Commands

#### Service Management
```bash
# Start services
docker-compose -f docker-compose.base.yml -f docker-compose.database.yml up -d

# Stop services (preserve volumes)
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f api-v11
docker-compose logs -f postgres
docker-compose logs --tail=100 alertmanager

# Scale service
docker-compose up -d --scale validator-node=5

# Update single service
docker-compose up -d --no-deps --build api-v11
```

#### Health Monitoring
```bash
# Check service health
docker-compose ps

# Inspect specific service
docker inspect aurigraph-postgres

# View resource usage
docker stats --no-stream

# Verify network connectivity
docker exec aurigraph-api-v11 curl http://postgres:5432/health
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Create namespace
kubectl create namespace aurigraph

# Create secrets
kubectl create secret generic aurigraph-db \
  --from-literal=password=<db-password> \
  -n aurigraph

kubectl create secret generic aurigraph-redis \
  --from-literal=password=<redis-password> \
  -n aurigraph
```

### Helm Installation

```bash
# Add Aurigraph Helm repository
helm repo add aurigraph https://helm.aurigraph.io
helm repo update

# Install with defaults
helm install aurigraph aurigraph/aurigraph \
  --namespace aurigraph

# Install with custom values
helm install aurigraph aurigraph/aurigraph \
  --namespace aurigraph \
  --values values-production.yml \
  --values values-aws.yml

# Verify installation
kubectl get all -n aurigraph
kubectl get pods -n aurigraph -w
```

### Manual Manifest Deployment

```bash
# Deploy manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmaps.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/pvc.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/redis.yml
kubectl apply -f k8s/api-v11.yml
kubectl apply -f k8s/validators.yml
kubectl apply -f k8s/monitoring.yml

# Verify rollout
kubectl rollout status deployment/api-v11 -n aurigraph
```

---

## Network Configuration

### Docker Network Topology

```
┌─────────────────────────────────────────┐
│  Frontend Network (10.1.0.0/24)         │
│  - NGINX API Gateway                    │
│  - Public endpoints (port 80, 443)      │
└─────────────┬───────────────────────────┘
              │
┌─────────────┴───────────────────────────┐
│  Backend Network (10.2.0.0/24)          │
│  - PostgreSQL (5432)                    │
│  - Redis (6379)                         │
│  - Hazelcast (5701)                     │
│  - MinIO (9000)                         │
│  - V11 API (9003)                       │
│  - Validators (9100-9102)               │
└─────────────┬───────────────────────────┘
              │
┌─────────────┴───────────────────────────┐
│  Monitoring Network (10.3.0.0/24)       │
│  - Prometheus (9090)                    │
│  - Grafana (3000)                       │
│  - AlertManager (9093)                  │
└─────────────┬───────────────────────────┘
              │
┌─────────────┴───────────────────────────┐
│  Logging Network (10.4.0.0/24)          │
│  - Elasticsearch (9200)                 │
│  - Logstash (5000)                      │
│  - Kibana (5601)                        │
└─────────────────────────────────────────┘
```

### Security Groups (AWS)

```yaml
# Frontend Security Group
- Inbound: 80/tcp (HTTP) from 0.0.0.0/0
- Inbound: 443/tcp (HTTPS) from 0.0.0.0/0
- Outbound: All

# Backend Security Group
- Inbound: 5432/tcp (PostgreSQL) from Backend/Monitoring
- Inbound: 6379/tcp (Redis) from Backend
- Inbound: 9003/tcp (API) from Frontend
- Inbound: 9100-9102/tcp (Validators) from Backend
- Outbound: All

# Monitoring Security Group
- Inbound: 9090/tcp (Prometheus) from Monitoring
- Inbound: 3000/tcp (Grafana) from 0.0.0.0/0 (optional)
- Outbound: All
```

---

## Security Hardening

### 1. Database Security

```bash
# PostgreSQL - Change default password
docker exec aurigraph-postgres psql -U aurigraph -d aurigraph_dlt \
  -c "ALTER USER aurigraph WITH PASSWORD '<strong-password>';"

# MongoDB - Enable authentication
docker exec aurigraph-mongodb mongosh admin \
  --eval "db.changeUserPassword('aurigraph', '<strong-password>');"

# Create read-only user
docker exec aurigraph-postgres psql -U aurigraph -d aurigraph_dlt \
  -c "CREATE USER readonly WITH PASSWORD '<strong-password>';" \
  -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;"
```

### 2. Redis Security

```yaml
# redis configuration
requirepass <strong-password>
appendonly yes
appendfsync everysec

# ACL configuration (Redis 6+)
user readonly on >readonlypassword ~* &get|keys
user application on >apppassword ~* &get|set|del
```

### 3. SSL/TLS Configuration

```bash
# Generate self-signed certificates (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/certs/private.key \
  -out /etc/nginx/certs/certificate.crt

# Use Let's Encrypt (production)
certbot certonly --manual \
  -d dlt.aurigraph.io \
  --agree-tos \
  --manual-public-ip-logging-ok
```

### 4. Container Security

```bash
# Run containers with read-only root filesystem
docker run --read-only -v /tmp --tmpfs /run <image>

# Drop unnecessary capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE <image>

# Use security scanning
docker scan --severity high <image>
```

### 5. Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# API Gateway
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Monitoring (local only)
sudo ufw allow from 10.3.0.0/24 to any port 9090

# Database (backend network only)
sudo ufw allow from 10.2.0.0/24 to any port 5432
```

---

## Monitoring & Observability

### Prometheus Metrics Collection

#### Configuration
```yaml
# /deployment/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api-v11'
    static_configs:
      - targets: ['api-v11:9003']
    metrics_path: '/q/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'validators'
    static_configs:
      - targets:
        - 'validator-1:9100'
        - 'validator-2:9101'
        - 'validator-3:9102'
```

#### Key Metrics to Monitor

```
# V11 API Performance
aurigraph_transactions_total          # Total transactions processed
aurigraph_transactions_per_second     # Current TPS
aurigraph_transaction_latency_ms      # P50, P95, P99 latencies
aurigraph_validator_consensus_health  # Consensus status
aurigraph_validator_block_time_ms     # Block production time

# Database Health
pg_stat_activity_count                # Active connections
pg_database_size_bytes                # Database size
pg_index_size_bytes                   # Index sizes

# Cache Performance
redis_used_memory_bytes               # Memory usage
redis_connected_clients               # Client count
redis_instantaneous_ops_per_sec       # OPS/sec

# System Resources
node_cpu_seconds_total                # CPU usage
node_memory_bytes_total               # Memory total
node_disk_free_bytes                  # Disk free space
```

### Grafana Dashboards

#### Default Dashboards
- **System Overview**: CPU, Memory, Disk, Network
- **API Performance**: TPS, Latencies, Error Rates
- **Database Health**: Connections, Query Performance, Index Status
- **Validator Status**: Block Height, Consensus Health, Peer Connectivity
- **Transaction Analysis**: Throughput by Type, Fee Distribution

#### Custom Dashboards (to create)
- Real-World Asset (RWA) Tokenization metrics
- Cross-chain Bridge performance
- AI Optimization effectiveness
- Quantum Crypto operations per second

### Logging & Log Aggregation

#### ELK Stack Configuration
```yaml
# Logstash pipeline
input {
  docker {
    host => "unix:///var/run/docker.sock"
  }
}

filter {
  json {
    source => "message"
  }
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:msg}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "aurigraph-%{+YYYY.MM.dd}"
  }
}
```

#### Log Retention Policies
```bash
# Keep 30 days of logs locally
docker-compose exec elasticsearch curl -X PUT \
  "localhost:9200/aurigraph-*/_settings" \
  -H 'Content-Type: application/json' \
  -d '{"index.lifecycle.name": "aurigraph-policy"}'
```

---

## Scaling Strategies

### Horizontal Scaling

#### Scale Validator Nodes
```bash
# Increase to 5 validators
docker-compose up -d --scale validator=5

# Kubernetes: Update replica count
kubectl scale deployment validators --replicas=5 -n aurigraph
```

#### Scale API Instances
```bash
# Docker Compose
docker-compose up -d --scale api-v11=3

# Kubernetes
kubectl scale deployment api-v11 --replicas=3 -n aurigraph
kubectl autoscale deployment api-v11 --min=3 --max=10 \
  --cpu-percent=70 -n aurigraph
```

### Vertical Scaling

#### Increase Resource Allocation
```yaml
# docker-compose.yml
api-v11:
  environment:
    JAVA_OPTS: -Xmx8g -Xms4g        # Increase heap
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 8G
      reservations:
        cpus: '2'
        memory: 4G
```

#### Kubernetes Resource Requests
```yaml
# k8s/api-v11-deployment.yml
spec:
  containers:
  - name: api-v11
    resources:
      requests:
        memory: "4Gi"
        cpu: "2"
      limits:
        memory: "8Gi"
        cpu: "4"
```

### Load Balancing

#### NGINX Configuration
```nginx
upstream api_backend {
    least_conn;
    server api-v11-1:9003;
    server api-v11-2:9003;
    server api-v11-3:9003;
}

server {
    listen 80;
    server_name dlt.aurigraph.io;

    location /api/v11 {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

---

## Disaster Recovery

### Backup Strategy

#### Database Backups
```bash
# Full PostgreSQL backup
docker exec aurigraph-postgres pg_dump \
  -U aurigraph aurigraph_dlt > backup_$(date +%Y%m%d).sql

# Incremental WAL backups
docker exec aurigraph-postgres pg_basebackup \
  -U aurigraph -D /var/lib/postgresql/backup/

# MongoDB backup
docker exec aurigraph-mongodb mongodump \
  --uri="mongodb://aurigraph:password@localhost:27017/aurigraph_assets" \
  --out=/data/backup/
```

#### Backup Schedule
```bash
# Daily full backup, hourly incremental
0 2 * * * /opt/backup/backup-postgresql.sh
0 * * * * /opt/backup/backup-wal.sh

# Weekly MongoDB backup
0 3 * * 0 /opt/backup/backup-mongodb.sh

# Monthly cold backup to S3
0 4 1 * * /opt/backup/backup-to-s3.sh
```

### Restore Procedures

#### PostgreSQL Recovery
```bash
# Restore from backup
docker exec aurigraph-postgres psql -U aurigraph aurigraph_dlt < backup.sql

# Point-in-time recovery (with WAL files)
docker exec aurigraph-postgres pg_ctl restart -D /var/lib/postgresql/data \
  -c recovery_target_timeline='latest' \
  -c recovery_target_time='2025-11-17 14:30:00'
```

#### Volume Recovery
```bash
# List available backups
aws s3 ls s3://aurigraph-backups/

# Restore volume from snapshot
aws ec2 create-volume --snapshot-id snap-xxxxx --availability-zone us-east-1a

# Attach and mount
aws ec2 attach-volume --volume-id vol-xxxxx --instance-id i-xxxxx --device /dev/sdf
sudo mount /dev/nvme1n1 /mnt/data
```

### RTO/RPO Targets

| Service | RTO | RPO |
|---------|-----|-----|
| API Service | 5 min | N/A (stateless) |
| PostgreSQL | 15 min | 1 hour |
| Redis | 5 min | 15 min |
| Validator State | 30 min | 10 min |

---

## Performance Tuning

### Database Optimization

#### PostgreSQL Configuration
```ini
# /etc/postgresql/16/main/postgresql.conf

# Memory settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 40MB
maintenance_work_mem = 1GB

# Connection settings
max_connections = 500
max_prepared_transactions = 100

# WAL settings
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Index Optimization
```sql
-- Analyze missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY abs(correlation) DESC;

-- Create recommended indexes
CREATE INDEX idx_transactions_timestamp ON transactions(created_at DESC);
CREATE INDEX idx_blocks_validator ON blocks(validator_id);
CREATE INDEX idx_validators_status ON validators(status, last_seen);
```

### Cache Optimization

#### Redis Eviction Policy
```yaml
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru        # Evict least recently used

# Consider:
# - allkeys-lru: Best for cache workloads
# - volatile-lru: For session storage with TTLs
# - allkeys-random: For uniform access patterns
```

#### Cache Warming
```bash
# Pre-load frequently accessed data
redis-cli < /opt/warmup.redis

# Monitor hit ratio
redis-cli INFO stats | grep hit_ratio
```

### JVM Tuning

#### G1GC Configuration
```bash
# Optimal for Aurigraph (>2GB heap)
JAVA_OPTS="-Xmx8g -Xms4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:InitiatingHeapOccupancyPercent=35 \
  -XX:+ParallelRefProcEnabled \
  -XX:+AlwaysPreTouch"
```

#### Monitoring JVM Metrics
```bash
# Check GC activity
jstat -gc <pid> 1000      # Every 1 second

# Profile heap usage
jmap -heap <pid>

# Monitor live objects
jcmd <pid> GC.heap_dump /tmp/heap.hprof
```

---

## Troubleshooting

### Common Issues

#### Service Won't Start

**Symptom**: Service container exits immediately

```bash
# Check logs
docker logs aurigraph-api-v11

# Common causes:
# 1. Port already in use
lsof -i :9003
kill -9 <PID>

# 2. Configuration error
docker inspect aurigraph-api-v11 | grep Env

# 3. Resource exhaustion
docker stats --no-stream
```

#### High Database CPU

**Symptom**: PostgreSQL using 80%+ CPU consistently

```bash
# Find slow queries
docker exec aurigraph-postgres psql -U aurigraph -d aurigraph_dlt \
  -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check missing indexes
docker exec aurigraph-postgres psql -U aurigraph -d aurigraph_dlt \
  -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema');"

# Analyze table
docker exec aurigraph-postgres psql -U aurigraph -d aurigraph_dlt \
  -c "ANALYZE transactions;"
```

#### Redis Memory Pressure

**Symptom**: Redis evicting keys, hit ratio < 90%

```bash
# Check memory status
docker exec aurigraph-redis redis-cli INFO memory

# Identify large keys
docker exec aurigraph-redis redis-cli --bigkeys

# Adjust eviction policy
docker exec aurigraph-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### Consensus Failures

**Symptom**: Validator nodes not reaching consensus

```bash
# Check validator logs
docker logs aurigraph-validator-1 | grep -i "consensus\|raft"

# Verify peer connectivity
docker exec aurigraph-validator-1 curl http://validator-2:9101/health

# Check block height sync
docker logs aurigraph-validator-1 | grep "block_height"

# Force consensus reset (caution: data loss risk)
docker exec aurigraph-validator-1 rm -rf /data/raft-state
docker restart aurigraph-validator-1
```

#### Network Connectivity Issues

**Symptom**: Services can't communicate

```bash
# Test network connectivity
docker exec aurigraph-api-v11 ping postgres
docker exec aurigraph-api-v11 ping validator-1

# Check DNS resolution
docker exec aurigraph-api-v11 nslookup postgres

# Inspect network
docker network inspect aurigraph-backend

# Recreate network if corrupted
docker network rm aurigraph-backend
docker network create aurigraph-backend --subnet=10.2.0.0/24
docker-compose restart
```

### Debugging Tools

```bash
# Interactive container shell
docker exec -it aurigraph-api-v11 /bin/sh

# Java debugging
docker exec -it aurigraph-api-v11 jps -l

# Process monitoring
docker exec aurigraph-api-v11 ps aux

# Network debugging
docker exec aurigraph-api-v11 netstat -tlnp
docker exec aurigraph-api-v11 tcpdump -i eth0 -n port 5432

# Resource monitoring
docker stats --no-stream
docker ps --format "table {{.Names}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## Support & Escalation

### Getting Help

- **Documentation**: https://docs.aurigraph.io/devops/
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **JIRA Tickets**: https://aurigraphdlt.atlassian.net/
- **Slack Channel**: #aurigraph-devops

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Infrastructure Lead | devops@aurigraph.io | 24/7 |
| Database Expert | dba@aurigraph.io | 24/7 |
| Platform Engineer | platform@aurigraph.io | Business hours |

---

## Appendix: Quick Reference

### Command Cheatsheet

```bash
# Start development environment
./deployment/start-dev.sh

# Start production with monitoring
docker-compose -f docker-compose.base.yml \
  -f docker-compose.database.yml \
  -f docker-compose.cache.yml \
  -f docker-compose.blockchain.yml \
  -f docker-compose.monitoring.yml up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f <service>

# Health check
docker-compose exec postgres pg_isready

# Backup database
docker-compose exec postgres pg_dump -U aurigraph > backup.sql

# Scale validators
docker-compose up -d --scale validator=5

# Monitor metrics
open http://localhost:3000          # Grafana
open http://localhost:9090          # Prometheus
open http://localhost:9003/q/health # API Health
```

---

**Document Control**:
- Version: 1.0.0
- Last Updated: November 17, 2025
- Next Review: December 17, 2025
- Author: DevOps Team
- Status: Production-Ready
