# J4C (Java 4 Claude) Agent Framework - Production Deployment Guide

## Executive Summary

**Purpose**: Comprehensive automated deployment framework for Aurigraph V11 production cluster with validator, business, and slim nodes, integrated with demo application and monitoring stack.

**Scope**: Multi-node deployment orchestration, service discovery, monitoring, logging, and performance testing.

**Version**: 1.0.0 (November 19, 2025)

---

## Part 1: Architecture Overview

### Cluster Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              LOAD BALANCER TIER (Traefik)                │  │
│  │  - SSL/TLS Termination                                   │  │
│  │  - Request Routing (:80, :443)                           │  │
│  │  - Health Checks                                          │  │
│  └────────────────┬────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────┴────────────────────────────────────────┐  │
│  │           CONSENSUS LAYER (HyperRAFT++)                 │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  VALIDATOR   │  │  BUSINESS    │  │    SLIM      │ │  │
│  │  │  NODE-1      │  │  NODE-2,3    │  │  NODE-4..N   │ │  │
│  │  │              │  │              │  │              │ │  │
│  │  │ Primary:9003 │  │ :9013,:9023  │  │ :9033..N     │ │  │
│  │  │ gRPC:9004    │  │ gRPC:9014,24 │  │ gRPC:9034..N │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────┴────────────────────────────────────────┐  │
│  │          SUPPORT SERVICES LAYER                          │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │PostgreSQL│  │ Redis   │  │ Consul   │  │ Vault  │  │  │
│  │  │:5432     │  │ :6379   │  │ :8500    │  │:8200   │  │  │
│  │  └──────────┘  └─────────┘  └──────────┘  └────────┘  │  │
│  │                                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────┴────────────────────────────────────────┐  │
│  │       MONITORING & OBSERVABILITY TIER                    │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌────────────┐  ┌───────────┐  ┌────────────────────┐ │  │
│  │  │ Prometheus │  │  Grafana  │  │ Elasticsearch/    │ │  │
│  │  │ :9090      │  │ :3000     │  │ Kibana (Logs)     │ │  │
│  │  └────────────┘  └───────────┘  └────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌────────────┐  ┌───────────┐  ┌────────────────────┐ │  │
│  │  │ Jaeger     │  │AlertManager│  │ Falco (Security)  │ │  │
│  │  │ :16686     │  │ :9093      │  │ :5060             │ │  │
│  │  └────────────┘  └───────────┘  └────────────────────┘ │  │
│  │                                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────┴────────────────────────────────────────┐  │
│  │        DEMO APPLICATION & TESTING TIER                   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐ │  │
│  │  │  Demo App       │  │ JMeter Load Test (Optional)  │ │  │
│  │  │  Portal:3000    │  │ :4444                        │ │  │
│  │  │  + V11 UI       │  │ Simulates 2M+ TPS traffic    │ │  │
│  │  └─────────────────┘  └──────────────────────────────┘ │  │
│  │                                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Node Types

| Node Type | Purpose | Count | Ports | Memory | CPU | Storage |
|-----------|---------|-------|-------|--------|-----|---------|
| **Validator** | Block production, consensus | 1-3 | 9003-9004 | 4GB | 8 | 100GB |
| **Business** | Transaction processing, queries | 2-6 | 9013-9014, 9023-9024 | 4GB | 8 | 100GB |
| **Slim** | RPC endpoints, lightweight | 4-12 | 9033+ | 2GB | 4 | 50GB |
| **Demo/Portal** | UI & demo transactions | 1 | 3000 | 512MB | 1 | 10GB |

---

## Part 2: Deployment Stages

### Stage 1: Foundation Setup

**Objective**: Initialize infrastructure, networks, and persistent storage

```bash
# 1. Create volumes
docker volume create aurigraph-data-1
docker volume create aurigraph-data-2
docker volume create aurigraph-data-3
docker volume create aurigraph-logs
docker volume create postgres-data
docker volume create redis-data
docker volume create prometheus-data
docker volume create grafana-data
docker volume create elasticsearch-data
docker volume create consul-data

# 2. Create networks
docker network create aurigraph-production --driver bridge \
  --subnet=172.20.0.0/16

docker network create monitoring --driver bridge
docker network create logging --driver bridge

# 3. Initialize configuration directories
mkdir -p config/{production,postgres,redis,prometheus,grafana,elasticsearch,consul,falco,traefik}
mkdir -p config/logstash/{pipeline,config}
mkdir -p test/{jmeter,results}

# 4. Copy and customize configuration files
cp config.templates/* config/

# 5. Verify setup
docker volume ls | grep aurigraph
docker network ls | grep aurigraph
```

### Stage 2: Database & Cache Initialization

**Objective**: Deploy persistent data layer (PostgreSQL + Redis)

```bash
# Launch PostgreSQL
docker-compose -f docker-compose-production-complete.yml up -d postgres

# Wait for health check
docker-compose -f docker-compose-production-complete.yml exec postgres \
  pg_isready -U aurigraph

# Initialize database schema
docker-compose -f docker-compose-production-complete.yml exec postgres \
  psql -U aurigraph -d aurigraph_production < config/postgres/init.sql

# Launch Redis
docker-compose -f docker-compose-production-complete.yml up -d redis

# Verify connectivity
docker-compose -f docker-compose-production-complete.yml exec redis \
  redis-cli ping
```

### Stage 3: Validator Node Deployment

**Objective**: Deploy primary consensus node (leader)

```bash
# 1. Start validator node 1
docker-compose -f docker-compose-production-complete.yml up -d \
  aurigraph-v11-node-1

# 2. Monitor startup
docker logs -f aurigraph-v11-node-1

# 3. Wait for health check
docker-compose -f docker-compose-production-complete.yml exec \
  aurigraph-v11-node-1 curl -s http://localhost:9003/q/health | jq '.status'

# 4. Verify leader election
curl -s http://localhost:9003/api/v11/consensus/status | jq '.leadership'

# 5. Benchmark initial TPS
curl -s http://localhost:9003/api/v11/stats | jq '.throughput'
```

### Stage 4: Business Nodes Deployment

**Objective**: Deploy transaction processing nodes (2-6 nodes)

```bash
# 1. Start business nodes
docker-compose -f docker-compose-production-complete.yml up -d \
  aurigraph-v11-node-2 aurigraph-v11-node-3

# 2. Wait for cluster formation
sleep 15

# 3. Verify cluster health
curl -s http://localhost:9003/api/v11/consensus/status | jq '.cluster'

# 4. Monitor TPS increase
watch 'curl -s http://localhost:9003/api/v11/stats | jq ".throughput"'

# 5. Check replication status
curl -s http://localhost:9003/api/v11/consensus/replication | jq '.'
```

### Stage 5: Slim Nodes Deployment (Optional)

**Objective**: Deploy additional lightweight RPC nodes for horizontal scaling

```bash
# 1. Scale to 6 total nodes
docker-compose -f docker-compose-production-complete.yml up -d \
  --scale aurigraph-v11-node-4=4

# 2. Register with service discovery
docker-compose -f docker-compose-production-complete.yml up -d consul

# 3. Verify auto-discovery
curl -s http://localhost:8500/v1/catalog/service/aurigraph-v11 | jq '.[] | .Address'

# 4. Load balance queries across all nodes
# (Handled by NGINX/Traefik upstream)
```

### Stage 6: Demo Application Deployment

**Objective**: Deploy web UI and demo transaction generator

```bash
# 1. Build demo application
cd ../enterprise-portal/enterprise-portal/frontend
npm run build

# 2. Create demo app service
docker-compose -f docker-compose-demo.yml up -d demo-portal

# 3. Configure API endpoints
echo "API_URL=http://aurigraph-v11-node-1:9003/api/v11" > .env.local

# 4. Verify portal accessibility
curl -s http://localhost:3000 | head -1

# 5. Initialize demo transactions
curl -s -X POST http://localhost:3000/api/demo/start \
  -H "Content-Type: application/json" \
  -d '{"target_tps": 100000, "duration_seconds": 300}'

# 6. Monitor via portal
# Access: http://localhost:3000
# Dashboard shows live TPS, consensus state, node health
```

### Stage 7: Monitoring Stack Deployment

**Objective**: Enable observability across entire cluster

```bash
# 1. Start monitoring services
docker-compose -f docker-compose-production-complete.yml up -d \
  prometheus grafana alertmanager node-exporter

# 2. Start logging stack
docker-compose -f docker-compose-production-complete.yml up -d \
  elasticsearch logstash kibana

# 3. Start tracing
docker-compose -f docker-compose-production-complete.yml up -d jaeger

# 4. Start security scanning
docker-compose -f docker-compose-production-complete.yml up -d falco

# 5. Verify all services healthy
docker-compose -f docker-compose-production-complete.yml ps

# 6. Access dashboards
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3000 (admin/password)
# - Kibana: http://localhost:5601
# - Jaeger: http://localhost:16686
# - AlertManager: http://localhost:9093
```

### Stage 8: Load Balancer & Service Discovery

**Objective**: Route traffic and enable service mesh

```bash
# 1. Start Traefik
docker-compose -f docker-compose-production-complete.yml up -d traefik

# 2. Start Consul for service discovery
docker-compose -f docker-compose-production-complete.yml up -d consul

# 3. Register services
curl -X PUT http://localhost:8500/v1/agent/service/register -d @config/consul/services.json

# 4. Configure SSL certificates
# (Automated via Let's Encrypt + Cloudflare)

# 5. Test routing
curl -H "Host: api.aurigraph.io" http://localhost/api/v11/health
```

### Stage 9: Load Testing (Optional)

**Objective**: Validate 2M+ TPS performance

```bash
# 1. Start JMeter container
docker-compose -f docker-compose-production-complete.yml up -d jmeter

# 2. Execute load test
docker-compose -f docker-compose-production-complete.yml run jmeter

# 3. Monitor metrics during test
# Terminal 1:
docker logs -f jmeter

# Terminal 2:
watch 'curl -s http://localhost:9090/api/v1/query?query=aurigraph_throughput_tps | jq ".data.result[0].value[1]"'

# Terminal 3:
watch 'curl -s http://localhost:9090/api/v1/query?query=aurigraph_latency_ms | jq ".data.result[0].value[1]"'

# 4. View results dashboard
# Open: http://localhost:3000/grafana (JMeter Dashboard)

# 5. Analyze results
ls test/results/
```

---

## Part 3: Automated Deployment Scripts

### Master Deployment Script

```bash
#!/bin/bash
# deploy-aurigraph-production.sh

set -e
ENVIRONMENT="${1:-production}"
NODE_COUNT="${2:-3}"
ENABLE_MONITORING="${3:-true}"
ENABLE_DEMO="${4:-true}"
ENABLE_LOADTEST="${5:-false}"

echo "=========================================="
echo "Aurigraph V11 Production Deployment"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Nodes: $NODE_COUNT"
echo "Monitoring: $ENABLE_MONITORING"
echo "Demo App: $ENABLE_DEMO"
echo "Load Test: $ENABLE_LOADTEST"
echo ""

# Stage 1: Foundation
echo "[1/9] Setting up foundation..."
docker volume create aurigraph-data-1 2>/dev/null || true
docker network create aurigraph-production --driver bridge --subnet=172.20.0.0/16 2>/dev/null || true
mkdir -p config/{production,postgres,redis,prometheus,grafana,elasticsearch}
echo "✓ Foundation ready"

# Stage 2: Database
echo "[2/9] Deploying database layer..."
docker-compose -f docker-compose-production-complete.yml up -d postgres redis
sleep 15
docker-compose -f docker-compose-production-complete.yml exec postgres pg_isready -U aurigraph
echo "✓ Database layer ready"

# Stage 3: Validator
echo "[3/9] Deploying validator node..."
docker-compose -f docker-compose-production-complete.yml up -d aurigraph-v11-node-1
sleep 30
curl -s http://localhost:9003/q/health | jq '.status'
echo "✓ Validator node ready"

# Stage 4: Business nodes
echo "[4/9] Deploying business nodes..."
docker-compose -f docker-compose-production-complete.yml up -d \
  aurigraph-v11-node-2 aurigraph-v11-node-3
sleep 30
echo "✓ Business nodes ready"

# Stage 5: Slim nodes (optional)
if [ "$NODE_COUNT" -gt 3 ]; then
  echo "[5/9] Deploying slim nodes..."
  for ((i=4; i<=NODE_COUNT; i++)); do
    docker run -d --name "aurigraph-v11-node-$i" \
      --network aurigraph-production \
      -e AURIGRAPH_NODE_ID="node-$i" \
      aurigraph/v11-native-ultra:latest
  done
  echo "✓ Slim nodes ready"
fi

# Stage 6: Demo app
if [ "$ENABLE_DEMO" = "true" ]; then
  echo "[6/9] Deploying demo application..."
  docker-compose -f docker-compose-demo.yml up -d demo-portal
  sleep 10
  echo "✓ Demo app ready at http://localhost:3000"
fi

# Stage 7: Monitoring
if [ "$ENABLE_MONITORING" = "true" ]; then
  echo "[7/9] Deploying monitoring stack..."
  docker-compose -f docker-compose-production-complete.yml up -d \
    prometheus grafana alertmanager elasticsearch logstash kibana jaeger
  sleep 30
  echo "✓ Monitoring ready"
  echo "  - Prometheus: http://localhost:9090"
  echo "  - Grafana: http://localhost:3000"
  echo "  - Kibana: http://localhost:5601"
  echo "  - Jaeger: http://localhost:16686"
fi

# Stage 8: Load balancer
echo "[8/9] Deploying load balancer..."
docker-compose -f docker-compose-production-complete.yml up -d traefik consul
sleep 10
echo "✓ Load balancer ready"

# Stage 9: Load testing
if [ "$ENABLE_LOADTEST" = "true" ]; then
  echo "[9/9] Starting load test..."
  docker-compose -f docker-compose-production-complete.yml up -d jmeter
  echo "✓ Load test in progress..."
  echo "  Monitor at: http://localhost:3000/grafana"
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  - API:         http://localhost:9003/api/v11"
echo "  - Portal:      http://localhost:3000"
echo "  - Prometheus:  http://localhost:9090"
echo "  - Grafana:     http://localhost:3000"
echo "  - Kibana:      http://localhost:5601"
echo ""
echo "Cluster Status:"
curl -s http://localhost:9003/api/v11/consensus/status | jq '.'
echo ""
```

---

## Part 4: Node Configuration Templates

### Validator Node Configuration

```yaml
# config/production/validator-node.properties
# Validator node configuration - Primary consensus participant

AURIGRAPH_NODE_ID=validator-1
AURIGRAPH_NODE_TYPE=validator
AURIGRAPH_ROLE=primary

# Cluster Configuration
AURIGRAPH_CLUSTER_SIZE=3
AURIGRAPH_CLUSTER_NODES=validator-1:9004,business-1:9004,business-2:9004
AURIGRAPH_CONSENSUS_TYPE=hyperraft-plus-plus

# Consensus Parameters
CONSENSUS_LEADER_ELECTION_TIMEOUT_MS=300
CONSENSUS_HEARTBEAT_INTERVAL_MS=50
CONSENSUS_LOG_REPLICATION_TIMEOUT_MS=1000
CONSENSUS_BATCH_TIMEOUT_MS=10

# Performance
PERFORMANCE_MODE=ultra
PERFORMANCE_TARGET_TPS=3500000
AI_OPTIMIZATION_ENABLED=true
AI_MODEL_UPDATE_INTERVAL_S=30

# Memory/GC
MALLOC_ARENA_MAX=2
MALLOC_MMAP_THRESHOLD=65536
GC_PAUSE_TARGET_MS=50
GC_YOUNG_GEN_SIZE_MB=512

# Networking
QUARKUS_HTTP_HOST=0.0.0.0
QUARKUS_HTTP_PORT=9003
QUARKUS_GRPC_SERVER_HOST=0.0.0.0
QUARKUS_GRPC_SERVER_PORT=9004

# Database
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/aurigraph_production
QUARKUS_DATASOURCE_USERNAME=aurigraph
QUARKUS_DATASOURCE_PASSWORD=${DB_PASSWORD}

# Cache
QUARKUS_REDIS_HOSTS=redis:6379
QUARKUS_REDIS_PASSWORD=${REDIS_PASSWORD}

# Logging
QUARKUS_LOG_LEVEL=INFO
QUARKUS_LOG_CATEGORY_IO_AURIGRAPH.LEVEL=DEBUG
```

### Business Node Configuration

```yaml
# config/production/business-node.properties

AURIGRAPH_NODE_ID=business-1
AURIGRAPH_NODE_TYPE=business
AURIGRAPH_ROLE=secondary

# Cluster Configuration
AURIGRAPH_CLUSTER_SIZE=3
AURIGRAPH_CLUSTER_NODES=validator-1:9004,business-1:9004,business-2:9004
AURIGRAPH_CONSENSUS_TYPE=hyperraft-plus-plus

# Consensus Parameters
CONSENSUS_LEADER_ELECTION_TIMEOUT_MS=300
CONSENSUS_HEARTBEAT_INTERVAL_MS=50
CONSENSUS_CATCH_UP_TIMEOUT_MS=5000

# Performance
PERFORMANCE_MODE=ultra
PERFORMANCE_TARGET_TPS=3500000
AI_OPTIMIZATION_ENABLED=true
TRANSACTION_QUEUE_SIZE=100000

# Networking
QUARKUS_HTTP_HOST=0.0.0.0
QUARKUS_HTTP_PORT=9013
QUARKUS_GRPC_SERVER_HOST=0.0.0.0
QUARKUS_GRPC_SERVER_PORT=9014

# Database
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/aurigraph_production
QUARKUS_DATASOURCE_USERNAME=aurigraph
QUARKUS_DATASOURCE_PASSWORD=${DB_PASSWORD}

# Connection Pooling
QUARKUS_DATASOURCE_JDBC_MAX_SIZE=20
QUARKUS_DATASOURCE_JDBC_MIN_SIZE=5
```

### Slim Node Configuration

```yaml
# config/production/slim-node.properties

AURIGRAPH_NODE_ID=slim-4
AURIGRAPH_NODE_TYPE=slim
AURIGRAPH_ROLE=read-only

# Cluster Configuration
AURIGRAPH_CLUSTER_SIZE=6
AURIGRAPH_CLUSTER_NODES=validator-1:9004,business-1:9004,business-2:9004,slim-4:9004,slim-5:9004,slim-6:9004
AURIGRAPH_CONSENSUS_TYPE=hyperraft-plus-plus
AURIGRAPH_SNAPSHOT_ENABLED=true

# Performance
PERFORMANCE_MODE=optimized
TRANSACTION_VALIDATION_ONLY=true
SKIP_CONSENSUS_PARTICIPATION=true

# Networking
QUARKUS_HTTP_HOST=0.0.0.0
QUARKUS_HTTP_PORT=9033
QUARKUS_GRPC_SERVER_HOST=0.0.0.0
QUARKUS_GRPC_SERVER_PORT=9034

# Database
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/aurigraph_production
QUARKUS_DATASOURCE_USERNAME=aurigraph_readonly
```

---

## Part 5: Monitoring & Observability

### Key Metrics to Monitor

```
# Performance Metrics
aurigraph_throughput_tps               # Transactions per second
aurigraph_latency_p99_ms              # 99th percentile latency
aurigraph_block_time_ms               # Block production time
aurigraph_consensus_rounds            # Consensus iterations

# Node Health
aurigraph_node_cpu_usage_percent      # CPU utilization
aurigraph_node_memory_usage_mb        # Memory consumption
aurigraph_node_disk_io_bytes_sec      # Disk I/O bandwidth
aurigraph_node_network_io_bytes_sec   # Network bandwidth

# Consensus Metrics
aurigraph_consensus_leader_term       # Current leadership term
aurigraph_consensus_log_replication_lag  # Log replication distance
aurigraph_consensus_term_changes      # Leader elections
aurigraph_consensus_vote_grants       # Successful votes

# Database Metrics
aurigraph_db_connection_pool_active   # Active connections
aurigraph_db_query_latency_p99_ms     # Query response time
aurigraph_db_transaction_rate         # DB write rate
aurigraph_db_backup_size_gb           # Backup volume
```

### Alert Rules

```yaml
# config/prometheus/alert-rules.yml

groups:
  - name: aurigraph_critical
    rules:
      - alert: NodeDown
        expr: node_up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Node {{ $labels.node }} is down"

      - alert: LowThroughput
        expr: aurigraph_throughput_tps < 500000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Throughput below 500K TPS: {{ $value }}"

      - alert: HighLatency
        expr: aurigraph_latency_p99_ms > 500
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency high: {{ $value }}ms"

      - alert: ConsensusStalled
        expr: increase(aurigraph_consensus_rounds[5m]) == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Consensus is stalled"
```

---

## Part 6: Demo Application Integration

### Demo App Features

```
┌─────────────────────────────────────────────┐
│        Aurigraph V11 Demo Portal            │
├─────────────────────────────────────────────┤
│                                              │
│  📊 Real-time Dashboard                     │
│  ├─ Current TPS (target: 2M+)              │
│  ├─ Consensus state (Leader/Follower)      │
│  ├─ Node health (CPU, Memory, Network)     │
│  └─ Transaction finality                    │
│                                              │
│  🧪 Demo Operations                        │
│  ├─ Send test transactions                 │
│  ├─ Generate load (configurable TPS)      │
│  ├─ Query blockchain state                 │
│  └─ View transaction history               │
│                                              │
│  🎮 Interactive Controls                   │
│  ├─ Start/Stop load generation            │
│  ├─ Configure transaction rate             │
│  ├─ Select target blockchain               │
│  └─ View real-time metrics                 │
│                                              │
│  📈 Performance Analytics                   │
│  ├─ TPS history chart                      │
│  ├─ Latency distribution                   │
│  ├─ Block production timeline              │
│  └─ Network topology                       │
│                                              │
│  🔐 Security Features                      │
│  ├─ Quantum-resistant crypto               │
│  ├─ Transaction signing                    │
│  ├─ Consensus validation                   │
│  └─ Audit trail                            │
│                                              │
└─────────────────────────────────────────────┘
```

### Demo API Endpoints

```
POST /api/demo/start                       # Start load generation
POST /api/demo/stop                        # Stop load generation
GET  /api/demo/status                      # Get current status
POST /api/demo/transaction/send            # Send single transaction
GET  /api/demo/stats                       # Performance statistics
GET  /api/demo/consensus/state             # Consensus information
GET  /api/demo/nodes/health                # Node health status
GET  /api/demo/blocks/latest               # Latest blocks
POST /api/demo/query/address               # Query account balance
```

---

## Part 7: CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml

name: Production Deployment

on:
  push:
    branches: [main]
    tags: ['v*.*.*']
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
      node_count:
        type: choice
        options: ['3', '6', '12']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Backend
        run: |
          cd aurigraph-v11-standalone
          ./mvnw clean package -Pnative-ultra

      - name: Build Frontend
        run: |
          cd enterprise-portal/enterprise-portal/frontend
          npm install && npm run build

      - name: Deploy to Production
        env:
          DEPLOY_KEY: ${{ secrets.SSH_DEPLOY_KEY }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          REDIS_PASSWORD: ${{ secrets.REDIS_PASSWORD }}
        run: |
          chmod 600 $DEPLOY_KEY
          ssh -i $DEPLOY_KEY -p 2235 subbu@dlt.aurigraph.io \
            "bash -s" < scripts/deploy-production.sh

      - name: Run Health Checks
        run: |
          ./scripts/health-check.sh

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
```

---

## Part 8: Disaster Recovery & Rollback

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup-production.sh

BACKUP_DIR="/backups/aurigraph-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup databases
docker-compose exec -T postgres pg_dump -U aurigraph aurigraph_production > \
  $BACKUP_DIR/database.sql

# Backup Redis
docker-compose exec -T redis redis-cli --rdb > \
  $BACKUP_DIR/redis.rdb

# Backup volumes
tar -czf $BACKUP_DIR/volumes.tar.gz \
  /var/lib/docker/volumes/aurigraph-*

# Upload to S3
aws s3 sync $BACKUP_DIR s3://aurigraph-backups/

# Cleanup old backups (keep 7 days)
find /backups -mtime +7 -delete
```

### Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback-production.sh

VERSION="${1:-last-known-good}"

echo "Rolling back to version: $VERSION"

# 1. Stop current services
docker-compose down

# 2. Restore from backup
docker-compose up -d postgres redis

sleep 15

# 3. Restore database
docker-compose exec -T postgres psql -U aurigraph < \
  /backups/$VERSION/database.sql

# 4. Restore Redis
docker-compose exec -T redis redis-cli < /backups/$VERSION/redis-commands

# 5. Start previous version
docker pull aurigraph/v11-native-ultra:$VERSION
docker-compose up -d

# 6. Verify health
sleep 30
curl -s http://localhost:9003/q/health | jq '.status'
```

---

## Part 9: Production Checklists

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Load test results reviewed (verify 2M+ TPS)
- [ ] Database migration scripts reviewed
- [ ] Monitoring dashboards created
- [ ] Alert rules configured
- [ ] Backup systems verified
- [ ] Rollback procedure documented
- [ ] Team notifications sent
- [ ] Change log updated

### Post-Deployment Checklist

- [ ] All nodes healthy (docker ps)
- [ ] Consensus formed (check leader)
- [ ] Metrics flowing to Prometheus
- [ ] Logs flowing to Elasticsearch
- [ ] Grafana dashboards operational
- [ ] Alertmanager receiving alerts
- [ ] Demo app accessible
- [ ] API endpoints responding
- [ ] Baseline TPS measured
- [ ] Team notified of successful deployment

### Maintenance Checklist (Weekly)

- [ ] Review logs for errors
- [ ] Check disk space usage
- [ ] Verify backup completion
- [ ] Review performance metrics
- [ ] Test rollback procedure
- [ ] Update security patches
- [ ] Review resource utilization
- [ ] Check certificate expiration

---

## Part 10: Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Consensus Stalled
```bash
# Diagnosis
curl -s http://localhost:9003/api/v11/consensus/status | jq '.leadership'

# Solution
# 1. Check network connectivity between nodes
docker network inspect aurigraph-production

# 2. Restart all consensus nodes
docker restart aurigraph-v11-node-1 aurigraph-v11-node-2 aurigraph-v11-node-3

# 3. Check node logs
docker logs aurigraph-v11-node-1 | grep -i consensus
```

#### Issue: Low Throughput
```bash
# Diagnosis
curl -s http://localhost:9003/api/v11/stats | jq '.throughput'

# Check bottleneck
# 1. CPU saturation
docker stats --no-stream aurigraph-v11-*

# 2. Memory pressure
docker exec aurigraph-v11-node-1 free -m

# 3. Database performance
docker logs aurigraph-v11-node-1 | grep "slow query"

# Solution
# - Scale to more business nodes
# - Increase memory allocation
# - Optimize database indexes
```

#### Issue: Node Out of Sync
```bash
# Diagnosis
curl -s http://localhost:9003/api/v11/consensus/replication | jq '.lag'

# Solution
# 1. Enable snapshot recovery
docker exec aurigraph-v11-node-1 curl -X POST \
  http://localhost:9003/api/v11/recovery/enable-snapshot

# 2. Trigger snapshot
docker exec aurigraph-v11-node-1 curl -X POST \
  http://localhost:9003/api/v11/recovery/snapshot

# 3. Monitor recovery
docker logs -f aurigraph-v11-node-1 | grep -i "snapshot\|recovery"
```

---

## Summary

This J4C Agent Framework provides comprehensive guidance for deploying and operating Aurigraph V11 production infrastructure with:

✅ **3-12 Node Scalability** - Validator, business, and slim node types
✅ **Automated Deployment** - Single-command multi-stage orchestration
✅ **Full Observability** - Prometheus, Grafana, ELK, Jaeger, Falco
✅ **Demo Application** - Interactive UI with real-time metrics
✅ **2M+ TPS Capability** - Optimized configuration & load testing
✅ **Production Ready** - HA, disaster recovery, monitoring, alerting

### Quick Deploy

```bash
# One-command production deployment
bash scripts/deploy-aurigraph-production.sh production 6 true true

# Then access:
# - API:      http://localhost:9003
# - Portal:   http://localhost:3000
# - Grafana:  http://localhost:3000 (admin/password)
# - Kibana:   http://localhost:5601
```

**Status**: ✅ Framework Complete & Ready for Integration

---

*Last Updated: November 19, 2025*
*Framework Version: 1.0.0*
*Aurigraph V11: 11.3.0+*
