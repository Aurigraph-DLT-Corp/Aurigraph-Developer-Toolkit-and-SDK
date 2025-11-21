# Aurigraph DLT V4.4.4 - Deployment Guide

## Overview

This guide describes the optimized deployment strategy for Aurigraph DLT V4.4.4 using separated Docker Compose files to ensure platform stability and seamless updates.

## Architecture

The deployment is split into two independent docker-compose files:

### 1. **docker-compose-core.yml** - Infrastructure & Core Services
Contains stable infrastructure components that rarely need redeployment:
- PostgreSQL 16 (Database)
- Redis 7 (Cache)
- Prometheus (Metrics)
- Grafana (Dashboards)
- NGINX 1.25 (Reverse Proxy)
- Aurigraph V11 API Service
- Enterprise Portal (React Frontend)

**Lifecycle**: Deploy once, run continuously with minimal restarts

### 2. **docker-compose-nodes.yml** - Node Clusters
Contains scalable node containers for blockchain operations:
- Validator Nodes Multi (5 instances)
- Business Nodes Group 1 (8 instances)
- Business Nodes Group 2 (7 instances)
- Slim Nodes (5 instances, edge/archive)

**Lifecycle**: Can be deployed, scaled, or redeployed independently without affecting core services

## Deployment Strategies

### Strategy 1: Full Stack Deployment (First-Time Setup)
Deploy infrastructure first, then nodes:

```bash
# Step 1: Deploy core infrastructure and services
docker-compose -f docker-compose-core.yml up -d

# Wait for services to stabilize (60 seconds)
sleep 60

# Step 2: Deploy all node clusters
docker-compose -f docker-compose-nodes.yml up -d

# Verify deployment
docker ps
```

### Strategy 2: Update Only Core Services (Zero-Downtime)
Update V11 API or Portal without affecting node clusters:

```bash
# Update V11 API or Portal image, then:
docker-compose -f docker-compose-core.yml up -d

# NGINX and other infrastructure are NOT restarted
# Nodes continue operating normally
```

### Strategy 3: Scale Node Clusters Only (Independent)
Add or update node containers without touching core:

```bash
# Restart or add nodes
docker-compose -f docker-compose-nodes.yml up -d

# Database, Redis, NGINX continue running
# No downtime for core services
```

### Strategy 4: Infrastructure Maintenance (Scheduled)
Perform database or monitoring updates with pre-planned downtime:

```bash
# Core infrastructure can be updated independently
# Nodes will pause briefly but continue with state persistence
docker-compose -f docker-compose-core.yml up -d

# NGINX reloads configuration without dropping connections
# Prometheus and Grafana updates don't affect blockchain
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- SSL certificates in `/etc/letsencrypt/live/aurcrt/`
- Sufficient disk space for `/var/lib/dlt/` volumes

### 1. Initial Deployment

```bash
cd /opt/DLT

# Deploy core services
docker-compose -f docker-compose-core.yml up -d

# Verify core services are healthy
docker-compose -f docker-compose-core.yml ps

# Deploy nodes
docker-compose -f docker-compose-nodes.yml up -d

# Check full deployment
docker ps
```

### 2. Verify Health

```bash
# Check V11 API health
curl http://localhost:9003/q/health

# Check portal
curl http://localhost:3000

# Check NGINX
curl https://dlt.aurigraph.io/health

# Check validator nodes
curl http://localhost:19003/q/health  # First validator instance
```

### 3. Monitor Deployment

```bash
# Watch container status
docker ps -a --format "table {{.Names}}\t{{.Status}}"

# View core service logs
docker-compose -f docker-compose-core.yml logs -f

# View node cluster logs
docker-compose -f docker-compose-nodes.yml logs -f validator-nodes-multi
```

## Container Details

### Core Services (docker-compose-core.yml)

| Service | Container Name | Port(s) | Memory | CPU | Status |
|---------|---|---|---|---|---|
| PostgreSQL | dlt-postgres | 5432 | 1G | 2.0 | Stable |
| Redis | dlt-redis | 6379 | 512M | 1.0 | Stable |
| Prometheus | dlt-prometheus | 9090 | 1G | 1.0 | Stable |
| Grafana | dlt-grafana | 3000 | 512M | 1.0 | Stable |
| V11 API | dlt-aurigraph-v11 | 9003-9004 | 2G | 4.0 | Core |
| NGINX | dlt-nginx-gateway | 80,443 | - | - | Stable |
| Portal | dlt-portal | 3000 | 256M | 0.5 | App |

### Node Clusters (docker-compose-nodes.yml)

| Node Group | Container Name | Instances | Port Range | Memory | CPU |
|---|---|---|---|---|---|
| Validators | dlt-validator-nodes-multi | 5 | 19003-19007 | 3G | 4.0 |
| Business-1 | dlt-business-nodes-1-multi | 8 | 21003-21010 | 3G | 4.0 |
| Business-2 | dlt-business-nodes-2-multi | 7 | 23003-23009 | 3G | 4.0 |
| Slim | dlt-slim-nodes-multi | 5 | 25003-25007 | 2G | 2.0 |

**Total**: 25 node instances (5+8+7+5)

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   External Network                      │
│         https://dlt.aurigraph.io (NGINX)               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (80/443)
                    ┌────▼────┐
                    │  NGINX   │ (dlt-nginx-gateway)
                    │  Gateway │
                    └────┬────┐
         ┌──────────────┘    └──────────────┐
         │                                  │
    dlt-frontend (172.20.0.0/16)    dlt-backend (172.21.0.0/16)
         │                                  │
    ┌────▼────┐                     ┌──────▼───────┐
    │ Portal  │                     │ V11 API      │
    │ Grafana │                     │ PostgreSQL   │
    └─────────┘                     │ Redis        │
                                    └──────┬───────┘
                                           │
                            ┌──────────────┼──────────────┐
                            │              │              │
                    ┌───────▼──┐   ┌──────▼────┐  ┌─────▼───┐
                    │Validator │   │ Business  │  │  Slim   │
                    │ Nodes    │   │ Nodes 1&2 │  │  Nodes  │
                    └──────────┘   └───────────┘  └─────────┘

dlt-monitoring (172.22.0.0/16)
    │
    ├─ Prometheus
    └─ Grafana
```

## Maintenance

### Adding More Nodes
Edit `docker-compose-nodes.yml` and add new service definitions, then:
```bash
docker-compose -f docker-compose-nodes.yml up -d
```

### Updating V11 Image
```bash
# Pull new image
docker pull aurigraph-v11:11.4.4

# Restart V11 without affecting nodes
docker-compose -f docker-compose-core.yml up -d aurigraph-v11-service
```

### Scaling Resources
Edit resource limits in respective compose file:
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Increase as needed
      cpus: '8.0'
```

Then restart: `docker-compose -f docker-compose-*.yml up -d`

## Troubleshooting

### NGINX Connection Refused
```bash
# Check if NGINX is running
docker ps | grep nginx-gateway

# Check NGINX logs
docker logs dlt-nginx-gateway | tail -30

# Test NGINX configuration
docker exec dlt-nginx-gateway nginx -t
```

### V11 API Startup Issues
```bash
# Check if database is ready
docker exec dlt-postgres pg_isready -U aurigraph

# Check V11 logs
docker logs dlt-aurigraph-v11 | tail -50

# Ensure database schema is current
docker exec dlt-postgres psql -U aurigraph -d aurigraph_production -c "SELECT version();"
```

### Node Container Issues
```bash
# Check node cluster status
docker logs dlt-validator-nodes-multi | tail -20

# Check if node processes are running inside container
docker exec dlt-validator-nodes-multi ps aux | grep java

# Check node logs
docker exec dlt-validator-nodes-multi ls -la /tmp/start-multi-nodes-*.log
```

## Recovery Procedures

### Emergency Stop All Services
```bash
# Stop nodes
docker-compose -f docker-compose-nodes.yml down

# Stop core services
docker-compose -f docker-compose-core.yml down
```

### Backup Database
```bash
docker exec dlt-postgres pg_dump -U aurigraph aurigraph_production > backup.sql
```

### Restore Database
```bash
docker exec -i dlt-postgres psql -U aurigraph aurigraph_production < backup.sql
```

## Performance Tuning

### Increase Node Memory
For high-load scenarios, modify `docker-compose-nodes.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Increase from 3G
      cpus: '8.0'  # Increase from 4.0
```

### Database Performance
Monitor PostgreSQL with:
```bash
docker exec dlt-postgres psql -U aurigraph -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Cache Optimization
Check Redis stats:
```bash
docker exec dlt-redis redis-cli INFO stats
```

## Deployment Checklist

- [ ] SSL certificates installed at `/etc/letsencrypt/live/aurcrt/`
- [ ] Volume directories exist: `/var/lib/dlt/{postgres-data,redis-data,prometheus-data,grafana-data,validator-nodes-data,business-nodes-*-data,slim-nodes-data}`
- [ ] Docker daemon running: `docker ps`
- [ ] Sufficient disk space: `df -h /var/lib/dlt/`
- [ ] Core services deployed: `docker-compose -f docker-compose-core.yml up -d`
- [ ] Core services healthy: `docker-compose -f docker-compose-core.yml ps`
- [ ] Node clusters deployed: `docker-compose -f docker-compose-nodes.yml up -d`
- [ ] All containers running: `docker ps | wc -l` (should show 11+ containers)
- [ ] Portal accessible: `curl http://localhost:3000`
- [ ] API responding: `curl http://localhost:9003/q/health`
- [ ] NGINX responding: `curl https://dlt.aurigraph.io/health`

## Documentation References

- [NODE_ROUTING_README.md](./config/nginx/NODE_ROUTING_README.md) - NGINX upstream configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup guide
- [AurigraphDLTVersionHistory.md](./AurigraphDLTVersionHistory.md) - Release history
