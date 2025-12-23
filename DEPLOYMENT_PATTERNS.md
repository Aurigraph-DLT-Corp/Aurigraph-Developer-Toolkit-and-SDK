# Aurigraph DLT V4.4.4 - Deployment Patterns & Best Practices

> Based on Claude Code deployment patterns and industry best practices

## Executive Summary

This document outlines production-ready deployment patterns for Aurigraph DLT V4.4.4, leveraging Claude Code deployment principles to ensure reliability, scalability, and maintainability.

## Part 1: Deployment Architecture Patterns

### 1.1 Blue-Green Deployment Pattern

**Purpose**: Zero-downtime updates with instant rollback capability

```yaml
# Blue Environment (Current Production)
services:
  v11-api-blue:
    image: aurigraph-v11:11.4.4-current
    environment:
      - DEPLOYMENT_SLOT=blue
      - TRAFFIC_WEIGHT=100

# Green Environment (Staging / Next Release)
services:
  v11-api-green:
    image: aurigraph-v11:11.4.4-next
    environment:
      - DEPLOYMENT_SLOT=green
      - TRAFFIC_WEIGHT=0

# NGINX switches traffic via simple config update
upstream v11-production {
    server v11-api-blue:9003 weight=100;  # Full traffic
    server v11-api-green:9003 weight=0;   # No traffic initially
}
```

**Deployment Process**:
1. Deploy new version to Green environment
2. Run smoke tests against Green
3. Switch NGINX upstream from Blue to Green (atomic)
4. Monitor Green for 5 minutes
5. Decommission Blue or keep as rollback

**Rollback**: Flip NGINX weights back to Blue (< 10 seconds)

### 1.2 Canary Deployment Pattern

**Purpose**: Gradual rollout to detect issues before full release

```yaml
# Traffic gradual shift
Week 1: 95% Blue (current) → 5% Green (canary)
  - Monitor error rates, latency, resource usage
  - If metrics stable, proceed to Week 2

Week 2: 80% Blue → 20% Green
  - Check database query patterns, cache hit rates
  - Run load tests on canary subset

Week 3: 50% Blue → 50% Green
  - Full A/B testing capability
  - Confidence metrics validated

Week 4: 0% Blue → 100% Green
  - Blue can be decommissioned
```

**NGINX Configuration**:
```nginx
upstream v11-canary {
    server v11-api-blue:9003  weight=95;  # Current
    server v11-api-green:9003 weight=5;   # Canary
}
```

### 1.3 Rolling Deployment Pattern

**Purpose**: Gradual node replacement for distributed systems

```bash
# For 25-node cluster (5 validators, 15 business, 5 slim)

# Phase 1: Update Slim Nodes (5 nodes)
docker-compose -f docker-compose-nodes.yml up -d \
  slim-nodes-multi \
  --pull always
sleep 120  # Monitor health

# Phase 2: Update Business Nodes Group 1 (8 nodes)
docker-compose -f docker-compose-nodes.yml up -d \
  business-nodes-1-multi
sleep 120

# Phase 3: Update Business Nodes Group 2 (7 nodes)
docker-compose -f docker-compose-nodes.yml up -d \
  business-nodes-2-multi
sleep 120

# Phase 4: Update Validator Nodes (5 nodes - last)
docker-compose -f docker-compose-nodes.yml up -d \
  validator-nodes-multi
```

---

## Part 2: Health Check & Observability Patterns

### 2.1 Health Check Strategy

**Liveness Probe** (Container restart if unhealthy):
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9003/q/health/live"]
  interval: 30s
  timeout: 5s
  retries: 2
  start_period: 60s
```

**Readiness Probe** (Ready for traffic):
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9003/q/health/ready"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 60s
```

**Startup Probe** (Give container time to bootstrap):
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9003/q/health/startup"]
  interval: 5s
  timeout: 5s
  retries: 30  # 150 seconds max
  start_period: 0s
```

### 2.2 Monitoring & Alerting

**Key Metrics to Track**:
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database connection pool saturation
- Cache hit rates (Redis)
- Node consensus health
- Transaction throughput (TPS)
- Memory usage by container

**Alert Thresholds**:
```
CRITICAL:
  - Error rate > 5%
  - P99 latency > 1000ms
  - Database pool utilization > 95%
  - Container memory > 90% limit

WARNING:
  - Error rate > 1%
  - P95 latency > 500ms
  - Database connections > 80%
  - Consensus leader election > 2 per hour
```

---

## Part 3: Failure Recovery Patterns

### 3.1 Circuit Breaker Pattern

Prevents cascading failures:

```java
@CircuitBreaker(
    requestVolumeThreshold = 20,  // trigger after 20 requests
    failureRatio = 0.5,           // if 50% fail
    delay = 5000,                 // wait 5 seconds before retry
    successThreshold = 2          // need 2 successful calls to close
)
@Retry(maxRetries = 3)
public Response callDownstreamService() {
    // Automatic fallback after threshold exceeded
}
```

### 3.2 Bulkhead Pattern

Isolate failures by resource pool:

```yaml
services:
  v11-api:
    environment:
      - EXECUTOR_API_POOL_SIZE=10
      - EXECUTOR_DB_POOL_SIZE=20
      - EXECUTOR_CACHE_POOL_SIZE=5
      # If DB pool saturated, doesn't affect cache operations
```

### 3.3 Retry with Exponential Backoff

```yaml
environment:
  - RETRY_MAX_ATTEMPTS=5
  - RETRY_INITIAL_DELAY_MS=100
  - RETRY_MAX_DELAY_MS=30000
  - RETRY_MULTIPLIER=2.0
  # Delays: 100ms, 200ms, 400ms, 800ms, 1600ms
```

---

## Part 4: Data Consistency & Safety Patterns

### 4.1 Transaction Safety

**Flyway Migration Versioning**:
```
db/migration/
├── V001__Initialize_schema.sql
├── V002__Create_users_table.sql
├── V003__Add_roles_table.sql
├── V004__Add_missing_columns.sql  ← Current
├── V005__Add_demos_table.sql      ← Next (for missing table)
└── V006__Add_is_system_role_column.sql
```

Each migration is:
- Idempotent (safe to run multiple times)
- Reversible (with undo script)
- Tested before deployment

### 4.2 Database Connection Pooling

```yaml
environment:
  - QUARKUS_DATASOURCE_MAX_SIZE=20
  - QUARKUS_DATASOURCE_MIN_SIZE=5
  - QUARKUS_DATASOURCE_IDLE_REMOVAL_INTERVAL=10m
  - QUARKUS_DATASOURCE_TRANSACTION_ISOLATION_LEVEL=READ_COMMITTED
```

### 4.3 Backup & Recovery

**Pre-Deployment Backup**:
```bash
#!/bin/bash
# Run before any production deployment
BACKUP_FILE="/backups/aurigraph_$(date +%Y%m%d_%H%M%S).sql"
docker exec dlt-postgres pg_dump -U aurigraph aurigraph_production \
  | gzip > $BACKUP_FILE
echo "Backup saved to $BACKUP_FILE"

# Point-in-time recovery capability
# if something goes wrong during deployment, restore from backup
```

---

## Part 5: GitOps & CI/CD Integration

### 5.1 Deployment Workflow (GitHub Actions)

**Trigger**: Push to `main` branch or manual trigger

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      deployment_strategy:
        description: 'Deployment strategy'
        required: true
        type: choice
        options:
          - blue-green
          - canary
          - rolling

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build V11 JAR
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw clean package -DskipTests

      - name: Deploy to staging
        run: |
          scp -P 22 target/aurigraph-v11-standalone-*.jar \
            subbu@dlt.aurigraph.io:/opt/DLT/staging/
          ssh -p 22 subbu@dlt.aurigraph.io \
            "cd /opt/DLT && docker-compose -f docker-compose-staging.yml up -d"

      - name: Run integration tests
        run: |
          ./scripts/run-integration-tests.sh http://staging.dlt.aurigraph.io:9003

      - name: Deploy to production (blue-green)
        if: success()
        run: |
          ssh -p 22 subbu@dlt.aurigraph.io \
            "cd /opt/DLT && ./scripts/deploy-blue-green.sh"

      - name: Verify production
        run: |
          ./scripts/verify-production.sh https://dlt.aurigraph.io
```

### 5.2 Rollback Procedure

**Automatic Rollback on Failure**:
```bash
#!/bin/bash
# scripts/rollback.sh

# If production health checks fail, instantly rollback
if curl -f http://localhost:9003/q/health/ready &> /dev/null; then
  echo "✓ Health check passed"
else
  echo "✗ Health check failed - initiating rollback"

  # Flip NGINX back to previous version
  sed -i 's/weight=100;  # green/weight=0;   # green/' docker-compose.yml
  sed -i 's/weight=0;   # blue/weight=100;  # blue/' docker-compose.yml

  docker-compose -f docker-compose.yml up -d nginx-gateway
  sleep 10

  # Verify rollback
  curl -f http://localhost:9003/q/health/ready && \
    echo "✓ Rollback successful" || \
    echo "✗ Rollback failed - manual intervention needed"
fi
```

---

## Part 6: Performance & Scalability Patterns

### 6.1 Horizontal Scaling

**Dynamic Node Addition**:
```bash
# Add 3 more business nodes to handle increased load
docker-compose -f docker-compose-nodes.yml up -d \
  --scale business-nodes-1-multi=3

# NGINX automatically load-balances to all instances
```

### 6.2 Database Query Optimization

**Connection Pooling**:
```properties
# application.properties
quarkus.datasource.max-size=30
quarkus.datasource.min-size=10
quarkus.datasource.idle-removal-interval=10m
```

**Query Caching**:
```yaml
environment:
  - QUARKUS_CACHE_TYPE=caffeine
  - QUARKUS_CACHE_CAFFEINE_BLOCKCHAIN_METRICS_MAXIMUM_SIZE=1000
  - QUARKUS_CACHE_CAFFEINE_BLOCKCHAIN_METRICS_EXPIRE_AFTER_WRITE=5m
```

### 6.3 Load Testing & Capacity Planning

```bash
#!/bin/bash
# Run load test before deployment
echo "Running load test: 1000 req/sec for 5 minutes"

ab -n 300000 -c 1000 -T 'application/json' \
  -p request.json \
  http://staging.dlt.aurigraph.io:9003/api/v11/transactions

# Monitor metrics
# - Target: < 500ms p95 latency
# - Target: < 1% error rate
# - Target: < 80% CPU utilization
```

---

## Part 7: Disaster Recovery (DR) Plan

### 7.1 RTO & RPO Targets

| Scenario | RTO | RPO | Action |
|----------|-----|-----|--------|
| Single node failure | 30s | 0s | Auto-restart via Docker |
| Database connection loss | 1m | 0s | Connection pool reconnect |
| Full V11 API crash | 2m | 0s | Docker container restart |
| Database corruption | 15m | 1h | Restore from hourly backup |
| Complete cluster failure | 30m | 4h | Full cluster restore from backup |

### 7.2 Backup Schedule

```
Hourly:   Keep last 24 backups        (0-24 hours ago)
Daily:    Keep last 7 backups          (1-7 days ago)
Weekly:   Keep last 4 backups          (1-4 weeks ago)
Monthly:  Keep last 12 backups         (1-12 months ago)
```

### 7.3 Disaster Recovery Drill

**Monthly (1st Sunday)**:
```bash
# Test recovery without affecting production
1. Restore latest backup to DR environment
2. Run full integration test suite
3. Verify data consistency
4. Document any issues
5. Archive DR report
```

---

## Part 8: Implementation Checklist

- [ ] **Week 1**: Implement blue-green deployment infrastructure
- [ ] **Week 2**: Setup GitHub Actions CI/CD pipeline
- [ ] **Week 3**: Implement health checks & monitoring
- [ ] **Week 4**: Create runbooks for common scenarios
- [ ] **Week 5**: Conduct disaster recovery drill
- [ ] **Week 6**: Document and train team on procedures
- [ ] **Week 7**: Implement automated rollback
- [ ] **Week 8**: Setup performance dashboards

---

## Part 9: Team Responsibilities

### Deployment Lead
- Approves deployments
- Monitors health during rollout
- Initiates rollback if needed

### Platform Engineer
- Maintains CI/CD pipeline
- Updates deployment configurations
- Manages infrastructure

### Database Administrator
- Manages Flyway migrations
- Performs backup/restore testing
- Monitors database health

### On-Call Engineer
- Responds to alerts
- Executes runbooks
- Documents incidents

---

## References

- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [Kubernetes Deployment Patterns](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Claude Code CI/CD Documentation](https://code.claude.com/docs)
- [Quarkus Production Guide](https://quarkus.io/guides/deploying-to-kubernetes)

---

**Last Updated**: November 21, 2025
**Version**: 1.0
**Status**: Production Ready
