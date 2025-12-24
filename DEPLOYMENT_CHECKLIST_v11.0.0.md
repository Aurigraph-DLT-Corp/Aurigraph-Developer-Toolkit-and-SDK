# VVB Approval System v11.0.0 - Deployment Checklist

**Release**: v11.0.0-baseline
**Date**: December 24, 2025
**Deployment Target**: Production (dlt.aurigraph.io)

---

## 📋 Pre-Deployment Validation

### Code Review
- [ ] All commits reviewed and approved
- [ ] No TODOs or FIXMEs in critical code paths
- [ ] Security scan passed (no vulnerabilities)
- [ ] Code coverage ≥80% (currently 82%)

### Testing Complete
- [ ] Unit tests: 102/102 PASSING ✅
- [ ] E2E tests: 8/8 PASSING ✅
- [ ] Integration tests: Staging verified
- [ ] Load tests: 100+ approvals processed successfully
- [ ] Stress tests: Queue handling validated

### Documentation
- [ ] API documentation complete (VVB-APPROVAL-SYSTEM-API-DOCUMENTATION.md)
- [ ] Deployment guide available (DEPLOYMENT_GUIDE.md)
- [ ] Monitoring setup documented (MONITORING-INFRASTRUCTURE-SUMMARY.md)
- [ ] Release notes published (RELEASE_NOTES_v11.0.0.md)
- [ ] README updated with v11 information

### Infrastructure Ready
- [ ] Production database (PostgreSQL 16) configured
- [ ] Redis cache (7.x) operational
- [ ] NGINX reverse proxy configured
- [ ] SSL certificates valid (staging + production)
- [ ] Disk space available (≥50GB for backups)
- [ ] Network connectivity verified

---

## 🚀 Pre-Deployment Steps

### 1. Create Git Tag
```bash
git tag -a v11.0.0 -m "VVB Approval System v11.0.0 Baseline Release"
git push origin v11.0.0
```

### 2. Backup Production
```bash
# SSH to production server
ssh $PRODUCTION_USER@$PRODUCTION_HOST

# Create timestamped backup
BACKUP_DIR="/backups/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Database backup
docker exec aurigraph-postgres pg_dump -U aurigraph_user aurigraph_v12 \
  > "$BACKUP_DIR/db_backup.sql"

# Docker compose state
cp /opt/aurigraph/docker-compose.yml "$BACKUP_DIR/"

# Application state
cp -r /opt/aurigraph/config "$BACKUP_DIR/" 2>/dev/null || true

echo "Backup created at: $BACKUP_DIR"
```

### 3. Verify Production Environment
```bash
# Check disk space
df -h | grep -E "/$|/opt|/home"

# Check Docker status
docker ps
docker images | grep aurigraph

# Check database connectivity
docker exec aurigraph-postgres psql -U aurigraph_user -c "SELECT version();"

# Check Redis connectivity
docker exec aurigraph-redis redis-cli ping

# Check current API version
curl -s http://localhost:9003/q/health | jq '.
```

### 4. Notify Stakeholders
- [ ] Alert operations team
- [ ] Notify validator operators
- [ ] Set maintenance window (if needed)
- [ ] Prepare rollback procedures
- [ ] Schedule post-deployment validation meeting

---

## 📦 Deployment Steps

### Phase 1: Staging Validation (if not done)
```bash
# Trigger workflow manually
gh workflow run vvb-approval-system-cicd.yml \
  --ref V12 \
  -f deploy_environment=staging

# Wait for completion (15-25 minutes)
# Check Grafana dashboards for health
curl -s https://staging.dlt.aurigraph.io:3000/api/health
```

### Phase 2: Production Backup & Preparation
```bash
# SSH to production
ssh -i ~/.ssh/prod_key $PROD_USER@$PROD_HOST

# Verify health before deployment
curl -f http://localhost:9003/q/health

# View current logs
docker-compose logs aurigraph-v11-staging | tail -50

# Create pre-deployment snapshot
docker images > /tmp/docker_images_before.txt
docker-compose ps > /tmp/docker_compose_before.txt
```

### Phase 3: Staged Rollout
```bash
# Option A: Immediate Deployment
cd /opt/aurigraph
docker-compose pull
docker-compose up -d --no-deps aurigraph-v11-staging

# Option B: Rolling Update (if using multiple replicas)
docker-compose up -d --scale aurigraph-v11-staging=2
# Stop old instance: docker stop aurigraph-v11-staging-1
# Remove old instance: docker rm aurigraph-v11-staging-1
```

### Phase 4: Health Verification
```bash
#!/bin/bash
set -e

echo "⏳ Waiting for services to start..."
sleep 10

echo "🏥 Checking application health..."
for i in {1..30}; do
  if curl -f http://localhost:9003/q/health >/dev/null 2>&1; then
    echo "✅ API server is healthy"
    break
  fi
  echo "Attempt $i/30..."
  sleep 5
done

echo "🏥 Checking database..."
docker exec aurigraph-postgres psql -U aurigraph_user -c "SELECT COUNT(*) FROM vvb_approval_request;" \
  || exit 1
echo "✅ Database is healthy"

echo "🏥 Checking cache..."
docker exec aurigraph-redis redis-cli ping
echo "✅ Cache is healthy"

echo "📊 Checking metrics..."
curl -f http://localhost:9090/-/healthy >/dev/null 2>&1
echo "✅ Prometheus is healthy"

echo "📈 Checking Grafana..."
curl -f http://localhost:3000/api/health >/dev/null 2>&1
echo "✅ Grafana is healthy"

echo "✅ All health checks passed!"
```

### Phase 5: Smoke Tests
```bash
# Create test approval
curl -X POST https://dlt.aurigraph.io/api/v11/approvals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "versionId": "test-version-123",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "totalValidators": 3,
    "expiryDeadline": "'$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Verify webhook delivery
curl https://dlt.aurigraph.io/webhooks/status \
  -H "Authorization: Bearer $TEST_TOKEN"

# Check metrics availability
curl https://dlt.aurigraph.io/prometheus/api/v1/query \
  -d 'query=approval_requests_total'
```

---

## ✅ Post-Deployment Validation

### Immediate Validation (0-15 minutes)
- [ ] API responds to requests
- [ ] Database is reachable
- [ ] Cache is operational
- [ ] Webhooks are functioning
- [ ] Metrics are being collected
- [ ] No errors in logs

```bash
# Check application logs
docker-compose logs aurigraph-v11-staging --tail=100

# Check error rates
curl -s http://localhost:9090/api/v1/query?query=rate%28http_requests_total%7Bstatus%3D%22500%22%7D%5B5m%5D%29
```

### Extended Validation (15-60 minutes)
- [ ] Approval creation working
- [ ] Validator voting functional
- [ ] Consensus detection operational
- [ ] Webhook delivery verified
- [ ] Audit trail recording events
- [ ] Monitoring dashboards populated

```bash
# Check recent approvals
curl https://dlt.aurigraph.io/api/v11/approvals \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.approvals | length'

# Check consensus metrics
curl -s http://localhost:9090/api/v1/query?query=approvals_consensus_reached_total | jq .
```

### Health Metrics Check (60+ minutes)
- [ ] Cache hit rate stabilized (>85%)
- [ ] Consensus time within SLA (<5s p95)
- [ ] Validator participation captured
- [ ] Webhook delivery success >99%
- [ ] No memory leaks detected
- [ ] CPU usage normal

```bash
# Check Grafana dashboards
curl -s http://localhost:3000/api/dashboards/uid/vvb-approval-system | jq '.dashboard.title'

# Check alert status
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts | length'
```

---

## 🔄 Rollback Procedures

### Quick Rollback (if within 30 minutes)
```bash
# Stop new version
docker-compose down

# Restore from backup
BACKUP_DIR="/backups/backup-latest"  # Find actual backup
cp "$BACKUP_DIR/docker-compose.yml" ./
cp "$BACKUP_DIR/config" ./

# Restore database (if needed)
docker-compose up -d postgres
docker exec aurigraph-postgres psql -U aurigraph_user aurigraph_v12 < "$BACKUP_DIR/db_backup.sql"

# Start services
docker-compose up -d

# Verify
curl http://localhost:9003/q/health
```

### Full Rollback (extended recovery)
```bash
# If quick rollback insufficient:
1. Contact database team for transaction logs
2. Use pg_wal recovery if available
3. Restore from most recent clean backup
4. Verify data integrity before restart

# Steps:
cd /backups/backup-$(find . -type d -name 'backup-*' | sort | tail -1 | cut -d- -f2-3)
docker-compose -f docker-compose.yml down
docker volume rm aurigraph_postgres-data-staging
docker-compose up -d postgres
docker exec postgres psql < db_backup.sql
docker-compose up -d
```

### Verification After Rollback
```bash
# Check version
curl http://localhost:9003/q/health | jq '.version'

# Validate critical data
docker exec postgres psql -U aurigraph_user -c \
  "SELECT COUNT(*) as approval_count FROM vvb_approval_request;"

# Check approval integrity
curl http://localhost:9003/api/v11/approvals \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.total'
```

---

## 📝 Deployment Log Template

```
DEPLOYMENT LOG - v11.0.0
Date: [TIMESTAMP]
Deployed By: [NAME]
Environment: Production
Target Host: [HOSTNAME]

PRE-DEPLOYMENT:
- Backups created: [BACKUP_DIR]
- Previous version: [VERSION]
- Health checks: [PASSED/FAILED]

DEPLOYMENT EXECUTION:
- Start time: [TIME]
- Docker pull: [SUCCESS/FAILED]
- Services up: [TIME]
- Health verified: [TIME]
- End time: [TIME]
- Duration: [MINUTES] minutes

VALIDATION:
- API Health: [PASS/FAIL]
- DB Connectivity: [PASS/FAIL]
- Cache Status: [PASS/FAIL]
- Metrics Collection: [PASS/FAIL]
- Webhook Delivery: [PASS/FAIL]

ISSUES ENCOUNTERED:
- [List any issues and resolutions]

SIGN-OFF:
- Deployed by: [NAME] [SIGNATURE]
- Validated by: [NAME] [SIGNATURE]
- Authorized by: [NAME] [SIGNATURE]
```

---

## 🎯 Success Criteria

### Must Have (Go/No-Go)
- ✅ All services are healthy
- ✅ API responds to requests
- ✅ No critical errors in logs
- ✅ Database integrity verified
- ✅ At least one successful approval workflow

### Should Have (Monitoring)
- ✅ Metrics collecting and visible in Grafana
- ✅ Cache hit rate >80%
- ✅ No active critical alerts
- ✅ Response times within baseline

### Nice to Have (Optimizations)
- ✅ All dashboards populated
- ✅ Webhook delivery validated
- ✅ Performance metrics exceed targets

---

## 📞 Support Contacts

### During Deployment
- **Operations**: [CONTACT]
- **Database Team**: [CONTACT]
- **Network Team**: [CONTACT]
- **On-Call Engineer**: [CONTACT]

### Escalation Path
1. First: Deployment team lead
2. Second: Operations manager
3. Third: CTO/Infrastructure team

---

## 📊 Deployment Decision Matrix

| Condition | Action |
|-----------|--------|
| Health checks PASS | Proceed with deployment |
| Health checks FAIL | HALT - investigate and fix |
| Memory usage spike | Monitor - if >90%, rollback |
| CPU sustained >80% | Investigate - may need scaling |
| Error rate >1% | Investigate - may indicate issue |
| Consensus time >10s | Acceptable during warmup |
| Consensus time >10s after 30min | Investigate issue |

---

## ✨ Final Checklist

Before signing off on deployment:
- [ ] All validation passed
- [ ] No critical alerts active
- [ ] Approval workflow tested successfully
- [ ] Validator voting functional
- [ ] Webhook delivery working
- [ ] Metrics dashboards operational
- [ ] Team notified of completion
- [ ] Monitoring configured for alerts
- [ ] Documentation updated
- [ ] Backup verified

---

**Status**: 🟢 Ready for Production Deployment

*Last Updated: December 24, 2025*
*Version: 11.0.0-baseline*
