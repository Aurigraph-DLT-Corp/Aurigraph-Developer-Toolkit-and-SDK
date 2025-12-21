# Aurigraph V11 Production Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Configuration](#configuration)
4. [Database Migration](#database-migration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Monitoring Setup](#monitoring-setup)
8. [Rollback Procedure](#rollback-procedure)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] PostgreSQL 16+ database cluster (with replication)
- [ ] Redis 7+ cache cluster
- [ ] NGINX reverse proxy with TLS 1.3
- [ ] Prometheus + Grafana for monitoring
- [ ] Minimum 16GB RAM per node
- [ ] Minimum 8 CPU cores per node
- [ ] 500GB SSD storage per node
- [ ] 10Gbps network connectivity

### Security Requirements
- [ ] TLS certificates obtained and validated
- [ ] HSM (Hardware Security Module) provisioned
- [ ] Secrets management system configured (Vault/AWS Secrets Manager)
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Rate limiting configured
- [ ] JWT signing keys generated
- [ ] Database credentials rotated

### Code Requirements
- [ ] All tests passing (95%+ coverage)
- [ ] Load testing completed (2M+ TPS validated)
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Code review approved
- [ ] Native image built and tested
- [ ] Database migrations tested
- [ ] Backup and restore tested

---

## Environment Setup

### 1. Create Environment Variables File

Create `/etc/aurigraph/production.env`:

```bash
# Application
VERSION=11.0.0
HTTP_PORT=9003
HTTP_HOST=0.0.0.0
MAX_CONNECTIONS=10000

# Security
CORS_ORIGINS=https://dlt.aurigraph.io,https://api.aurigraph.io
JWT_PUBLIC_KEY_URL=https://iam.aurigraph.io/realms/aurigraph/protocol/openid-connect/certs
JWT_ISSUER=https://iam.aurigraph.io/realms/aurigraph

# Database (use secrets management for password)
DB_USERNAME=aurigraph_prod
DB_PASSWORD=${VAULT:secret/database/aurigraph/password}
DB_URL=jdbc:postgresql://postgres-primary:5432/aurigraph_production
DB_POOL_MAX=100
DB_POOL_MIN=10

# Redis
REDIS_URL=redis://redis-cluster:6379
REDIS_PASSWORD=${VAULT:secret/redis/aurigraph/password}

# Consensus
CONSENSUS_NODE_ID=prod-node-1
CONSENSUS_VALIDATORS=prod-node-1,prod-node-2,prod-node-3,prod-node-4,prod-node-5
CONSENSUS_TARGET_TPS=5000000

# Oracle Verification
ORACLE_MIN_CONSENSUS=0.67
ORACLE_MIN_REQUIRED=3
ORACLE_TIMEOUT=7

# AI Optimization
AI_OPTIMIZATION_ENABLED=true
AI_TARGET_TPS=10000000

# HSM Configuration
HSM_ENABLED=true
HSM_LIBRARY_PATH=/usr/lib/softhsm/libsofthsm2.so
HSM_SLOT=0
HSM_PIN=${VAULT:secret/hsm/aurigraph/pin}

# LevelDB
LEVELDB_PATH=/var/lib/aurigraph/leveldb/${CONSENSUS_NODE_ID}
LEVELDB_ENCRYPTION=true
LEVELDB_PASSWORD=${VAULT:secret/leveldb/aurigraph/password}

# Monitoring
TRACING_ENABLED=true
JAEGER_ENDPOINT=http://jaeger:14268/api/traces

# Backup
BACKUP_ENABLED=true
BACKUP_RETENTION=30
BACKUP_DESTINATION=s3://aurigraph-production-backups
```

### 2. Set File Permissions

```bash
sudo chown aurigraph:aurigraph /etc/aurigraph/production.env
sudo chmod 600 /etc/aurigraph/production.env
```

---

## Configuration

### 1. Copy Production Configuration

```bash
cp config/production/application-production.properties src/main/resources/application-prod.properties
```

### 2. Customize Configuration

Edit `application-prod.properties` and replace all `CHANGE_ME` values with actual credentials from your secrets management system.

### 3. Validate Configuration

```bash
# Test configuration loading
./mvnw quarkus:dev -Dquarkus.profile=prod

# Verify all required properties are set
./scripts/validate-config.sh
```

---

## Database Migration

### 1. Backup Current Database

```bash
# Create backup
pg_dump -h postgres-primary -U aurigraph_prod aurigraph_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backup_*.sql | head -20
```

### 2. Test Migrations (Staging Environment)

```bash
# Run migrations on staging
QUARKUS_PROFILE=staging ./mvnw clean package
java -jar target/quarkus-app/quarkus-run.jar

# Verify migrations applied
psql -h postgres-staging -U aurigraph_prod -d aurigraph_production -c "SELECT * FROM flyway_schema_history;"
```

### 3. Run Production Migrations

```bash
# Dry-run first
QUARKUS_PROFILE=prod FLYWAY_VALIDATE_MIGRATION_NAMING=true ./mvnw flyway:validate

# Apply migrations
QUARKUS_PROFILE=prod ./mvnw flyway:migrate

# Verify
psql -h postgres-primary -U aurigraph_prod -d aurigraph_production -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

---

## Deployment Steps

### 1. Build Native Image

```bash
# Clean build
./mvnw clean package -Pnative -Dquarkus.native.container-build=true

# Verify binary
ls -lh target/*-runner
file target/*-runner

# Test locally
./target/aurigraph-v11-standalone-11.0.0-runner --help
```

### 2. Create Docker Image (if using containers)

```bash
# Build image
docker build -f src/main/docker/Dockerfile.native -t aurigraph/v11:11.0.0 .

# Tag for registry
docker tag aurigraph/v11:11.0.0 registry.aurigraph.io/aurigraph/v11:11.0.0
docker tag aurigraph/v11:11.0.0 registry.aurigraph.io/aurigraph/v11:latest

# Push to registry
docker push registry.aurigraph.io/aurigraph/v11:11.0.0
docker push registry.aurigraph.io/aurigraph/v11:latest
```

### 3. Deploy to Production Nodes

**Option A: Direct Binary Deployment**

```bash
# Copy binary to each node
for node in prod-node-{1..5}; do
  scp target/aurigraph-v11-standalone-11.0.0-runner aurigraph@$node:/opt/aurigraph/bin/
  scp /etc/aurigraph/production.env aurigraph@$node:/opt/aurigraph/config/
done

# Start service on each node
for node in prod-node-{1..5}; do
  ssh aurigraph@$node 'sudo systemctl start aurigraph-v11'
done
```

**Option B: Docker/Kubernetes Deployment**

```bash
# Update Kubernetes deployment
kubectl set image deployment/aurigraph-v11 aurigraph=registry.aurigraph.io/aurigraph/v11:11.0.0

# Wait for rollout
kubectl rollout status deployment/aurigraph-v11

# Verify pods running
kubectl get pods -l app=aurigraph-v11
```

### 4. Configure Load Balancer

```bash
# Update NGINX configuration
sudo cp deployment/nginx/aurigraph-v11.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Post-Deployment Validation

### 1. Health Checks

```bash
# Check liveness
curl https://dlt.aurigraph.io/q/health/live

# Check readiness
curl https://dlt.aurigraph.io/q/health/ready

# Check startup
curl https://dlt.aurigraph.io/q/health/started

# Detailed health
curl https://dlt.aurigraph.io/q/health | jq .
```

### 2. Metrics Validation

```bash
# Check Prometheus metrics
curl https://dlt.aurigraph.io/q/metrics | grep oracle_verifications_total

# Verify business metrics
curl https://dlt.aurigraph.io/q/metrics | grep -E "oracle|websocket|transactions"
```

### 3. Functional Testing

```bash
# Test API endpoints
curl -X GET https://dlt.aurigraph.io/api/v11/info
curl -X GET https://dlt.aurigraph.io/api/v11/health

# Test oracle verification
curl -X POST https://dlt.aurigraph.io/api/v11/oracle/verify \
  -H "Content-Type: application/json" \
  -d '{"assetId": "AAPL", "claimedValue": "150.00"}'

# Test WebSocket connectivity
wscat -c wss://dlt.aurigraph.io/ws/metrics
```

### 4. Performance Validation

```bash
# Load test (1M requests)
ab -n 1000000 -c 1000 https://dlt.aurigraph.io/api/v11/health

# Sustained TPS test
./scripts/performance-test.sh --duration 300 --target-tps 2000000
```

### 5. Security Validation

```bash
# Verify TLS configuration
ssllabs-scan --quiet dlt.aurigraph.io

# Check security headers
curl -I https://dlt.aurigraph.io | grep -E "X-Frame-Options|Strict-Transport-Security"

# Verify CORS
curl -H "Origin: https://evil.com" https://dlt.aurigraph.io/api/v11/health
```

---

## Monitoring Setup

### 1. Grafana Dashboards

```bash
# Import Aurigraph V11 dashboard
curl -X POST https://grafana.aurigraph.io/api/dashboards/db \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -d @deployment/grafana/aurigraph-v11-dashboard.json
```

### 2. Prometheus Alerts

```bash
# Apply alert rules
kubectl apply -f deployment/prometheus/aurigraph-v11-alerts.yaml

# Verify rules loaded
curl https://prometheus.aurigraph.io/api/v1/rules | jq '.data.groups[] | select(.name=="aurigraph-v11")'
```

### 3. Log Aggregation

```bash
# Configure Filebeat (if using ELK)
sudo cp deployment/filebeat/aurigraph-v11.yml /etc/filebeat/modules.d/
sudo filebeat modules enable aurigraph
sudo systemctl restart filebeat
```

---

## Rollback Procedure

### In Case of Issues

```bash
# 1. Stop new deployment
kubectl rollout undo deployment/aurigraph-v11

# 2. Restore database (if needed)
pg_restore -h postgres-primary -U aurigraph_prod -d aurigraph_production backup_YYYYMMDD_HHMMSS.sql

# 3. Restart services with previous version
kubectl set image deployment/aurigraph-v11 aurigraph=registry.aurigraph.io/aurigraph/v11:11.0.0-previous

# 4. Verify rollback
kubectl rollout status deployment/aurigraph-v11
curl https://dlt.aurigraph.io/q/health

# 5. Update load balancer (if needed)
sudo systemctl reload nginx
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Symptoms**: Health checks failing, pods restarting

**Resolution**:
```bash
# Check logs
kubectl logs -l app=aurigraph-v11 --tail=100

# Check configuration
kubectl exec -it aurigraph-v11-xxx -- env | grep -E "DB_|REDIS_|CONSENSUS_"

# Verify connectivity
kubectl exec -it aurigraph-v11-xxx -- nc -zv postgres-primary 5432
kubectl exec -it aurigraph-v11-xxx -- nc -zv redis-cluster 6379
```

#### 2. High Memory Usage

**Symptoms**: OOMKilled pods, slow performance

**Resolution**:
```bash
# Check JVM heap
kubectl exec -it aurigraph-v11-xxx -- jcmd 1 VM.native_memory summary

# Analyze heap dump
kubectl exec -it aurigraph-v11-xxx -- jmap -dump:format=b,file=/tmp/heap.hprof 1
kubectl cp aurigraph-v11-xxx:/tmp/heap.hprof ./heap.hprof

# Adjust memory limits
kubectl set resources deployment/aurigraph-v11 --limits=memory=8Gi
```

#### 3. Database Connection Issues

**Symptoms**: Timeouts, connection pool exhausted

**Resolution**:
```bash
# Check connection pool
curl https://dlt.aurigraph.io/q/metrics | grep hikaricp

# Verify database connections
psql -h postgres-primary -U aurigraph_prod -d aurigraph_production \
  -c "SELECT * FROM pg_stat_activity WHERE datname='aurigraph_production';"

# Increase pool size
kubectl set env deployment/aurigraph-v11 DB_POOL_MAX=200
```

#### 4. WebSocket Connection Failures

**Symptoms**: Clients can't connect, broadcasts failing

**Resolution**:
```bash
# Check WebSocket health
curl https://dlt.aurigraph.io/q/health | jq '.checks[] | select(.name=="websocket-service")'

# Test WebSocket directly
wscat -c wss://dlt.aurigraph.io/ws/metrics

# Check NGINX configuration
sudo nginx -T | grep -A 10 "location /ws"
```

---

## Production Readiness Checklist

### Pre-Launch
- [ ] All security credentials rotated
- [ ] Monitoring dashboards configured
- [ ] Alert rules tested
- [ ] Backup system verified
- [ ] Disaster recovery plan documented
- [ ] On-call rotation established
- [ ] Runbook created and reviewed

### Post-Launch (Day 1)
- [ ] Monitor error rates (target: <0.1%)
- [ ] Verify TPS metrics (target: 2M+ sustained)
- [ ] Check memory usage (target: <70%)
- [ ] Monitor database connections (target: <80% pool)
- [ ] Review security logs (no critical alerts)

### Post-Launch (Week 1)
- [ ] Performance review completed
- [ ] Capacity planning updated
- [ ] Incident post-mortems documented
- [ ] Customer feedback collected
- [ ] Optimization opportunities identified

---

## Support Contacts

- **DevOps Team**: devops@aurigraph.io
- **Security Team**: security@aurigraph.io
- **On-Call**: +1-XXX-XXX-XXXX
- **Incident Management**: https://incidents.aurigraph.io

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | Production Readiness Agent | Initial production deployment guide |

