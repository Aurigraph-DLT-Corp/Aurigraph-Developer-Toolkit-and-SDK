# Production Deployment Checklist

Use this checklist for every production deployment to ensure safety and reliability.

## Pre-Deployment (30 minutes before)

### Code & Build
- [ ] All tests passing (unit, integration, performance)
- [ ] Code reviewed and approved (minimum 2 reviewers)
- [ ] Merge to main branch completed
- [ ] Version number incremented in pom.xml
- [ ] Git tag created for release
- [ ] Changelog updated with release notes
- [ ] No SNAPSHOT dependencies in pom.xml
- [ ] Build successful: `./mvnw clean package`
- [ ] Native build successful (if deploying native): `./mvnw package -Pnative`
- [ ] JAR size within expected range (~175MB)

### Database & Schemas
- [ ] Database migrations prepared and tested
- [ ] Backup of production database completed
- [ ] Schema changes are backward compatible
- [ ] Migration rollback plan documented
- [ ] Database connection pool sized appropriately
- [ ] Indexes optimized for new queries

### Configuration
- [ ] Production application.properties reviewed
- [ ] Environment variables validated
- [ ] Secrets rotated if needed
- [ ] JVM settings confirmed (heap, GC, threads)
- [ ] Port bindings verified (9003 for HTTP, 9004 for gRPC)
- [ ] Log levels appropriate for production
- [ ] Feature flags configured correctly

### Infrastructure
- [ ] Server resources adequate (CPU, RAM, disk)
- [ ] Disk space >20% free on production server
- [ ] Load balancer health checks configured
- [ ] Firewall rules updated if needed
- [ ] SSL certificates valid for >30 days
- [ ] Monitoring alerts configured

### Communication
- [ ] Deployment window communicated to team
- [ ] Stakeholders notified (if user-facing changes)
- [ ] Rollback plan documented and shared
- [ ] On-call engineer identified
- [ ] Deployment notes prepared

## During Deployment (15-30 minutes)

### Backup Current Version
```bash
# Create timestamped backup
ssh $REMOTE_USER@$REMOTE_HOST "
  cd $DEPLOY_PATH &&
  cp $JAR_NAME $JAR_NAME.backup-$(date +%Y%m%d-%H%M%S)"
```
- [ ] Backup created successfully
- [ ] Backup file size matches original
- [ ] At least 3 previous backups exist

### Stop Service
```bash
# Graceful shutdown
PID=$(ssh $REMOTE_USER@$REMOTE_HOST "ps aux | grep $JAR_NAME | grep -v grep | awk '{print \$2}'")
ssh $REMOTE_USER@$REMOTE_HOST "kill -15 $PID"
sleep 10
```
- [ ] Service stopped gracefully
- [ ] No active connections remaining
- [ ] No errors in shutdown logs
- [ ] Port 9003 released

### Deploy New Version
```bash
# Upload new JAR
scp target/$JAR_NAME $REMOTE_USER@$REMOTE_HOST:$DEPLOY_PATH/
```
- [ ] Upload completed successfully
- [ ] File integrity verified (checksum match)
- [ ] Permissions set correctly (755)
- [ ] Ownership correct

### Database Migration (if needed)
```bash
# Run migrations
ssh $REMOTE_USER@$REMOTE_HOST "
  cd $DEPLOY_PATH &&
  java -jar $JAR_NAME migrate"
```
- [ ] Migrations applied successfully
- [ ] No migration errors
- [ ] Data integrity verified
- [ ] Migration logged

### Start Service
```bash
# Start with optimized JVM settings
nohup java \
  -Xms16g -Xmx32g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=20 \
  -XX:G1ReservePercent=15 \
  -XX:InitiatingHeapOccupancyPercent=30 \
  -Dquarkus.http.port=9003 \
  -Dquarkus.profile=prod \
  -jar $JAR_NAME > logs/application.log 2>&1 &
```
- [ ] Service started
- [ ] Process ID captured
- [ ] No startup errors in logs
- [ ] Service listening on port 9003

## Post-Deployment Verification (15 minutes)

### Health Checks
```bash
# Wait for startup (max 30 seconds)
for i in {1..30}; do
  curl -f http://localhost:9003/q/health && break
  sleep 1
done
```
- [ ] Health endpoint responding (200 OK)
- [ ] Readiness probe passing
- [ ] Liveness probe passing
- [ ] All health checks green

### Smoke Tests
- [ ] GET /api/v11/info returns correct version
- [ ] GET /api/v11/stats returns data
- [ ] POST /api/v11/transaction works
- [ ] GET /api/v11/bridge/health healthy
- [ ] gRPC port 9004 accepting connections
- [ ] WebSocket connections working

### Performance Validation
- [ ] Response time < 100ms for /health
- [ ] TPS > 1.5M (if performance critical)
- [ ] Memory usage < 80% of max heap
- [ ] CPU usage stable
- [ ] GC pauses < 50ms
- [ ] No memory leaks detected

### Logs Review
```bash
# Check for errors
tail -100 logs/application.log | grep ERROR
tail -100 logs/gc.log | grep "GC pause"
```
- [ ] No ERROR level logs
- [ ] No WARNING level logs (unexpected)
- [ ] No stack traces
- [ ] GC activity normal
- [ ] No unusual patterns

### Monitoring & Metrics
- [ ] Prometheus metrics scraping
- [ ] Grafana dashboards updating
- [ ] No alerts firing
- [ ] Request rate normal
- [ ] Error rate < 0.1%
- [ ] Latency within SLA

### Database
- [ ] Connection pool healthy
- [ ] Query performance normal
- [ ] No long-running queries
- [ ] No deadlocks
- [ ] Replication lag < 1s

### External Integrations
- [ ] JIRA API connectivity verified
- [ ] Bridge to Ethereum working
- [ ] Bridge to BSC working
- [ ] Bridge to Polygon working
- [ ] Bridge to Avalanche working
- [ ] Oracles responding

## Rollback Procedure (if needed)

### Triggers for Rollback
- ❌ Health checks failing after 2 minutes
- ❌ Error rate > 5%
- ❌ Critical functionality broken
- ❌ Performance degradation > 50%
- ❌ Data corruption detected
- ❌ Security vulnerability discovered

### Rollback Steps
```bash
# 1. Stop failed deployment
ssh $REMOTE_USER@$REMOTE_HOST "
  kill -9 \$(ps aux | grep $JAR_NAME | grep -v grep | awk '{print \$2}')"

# 2. Restore backup
LATEST_BACKUP=\$(ssh $REMOTE_USER@$REMOTE_HOST "ls -t $DEPLOY_PATH/$JAR_NAME.backup-* | head -1")
ssh $REMOTE_USER@$REMOTE_HOST "cp \$LATEST_BACKUP $DEPLOY_PATH/$JAR_NAME"

# 3. Rollback database migrations (if needed)
ssh $REMOTE_USER@$REMOTE_HOST "
  cd $DEPLOY_PATH &&
  java -jar $JAR_NAME migrate-rollback"

# 4. Restart with backup
ssh $REMOTE_USER@$REMOTE_HOST "
  cd $DEPLOY_PATH &&
  nohup java [JVM_OPTS] -jar $JAR_NAME > logs/application.log 2>&1 &"

# 5. Verify rollback
curl -f http://$REMOTE_HOST:9003/q/health
```
- [ ] Service stopped
- [ ] Backup restored
- [ ] Database rolled back (if needed)
- [ ] Service restarted
- [ ] Health checks passing
- [ ] Functionality verified

## Post-Deployment (1 hour monitoring)

### First 15 Minutes
- [ ] Monitor logs continuously
- [ ] Watch for error spikes
- [ ] Check memory growth
- [ ] Verify user traffic normal
- [ ] No customer complaints

### First Hour
- [ ] Response times stable
- [ ] Error rate < 0.1%
- [ ] Memory usage stable
- [ ] GC activity normal
- [ ] No resource leaks
- [ ] All integrations working

### Communication
- [ ] Deployment success announced
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Monitoring continued for 24h
- [ ] Postmortem scheduled (if issues)

## Deployment Record

```
Deployment ID: [auto-generated]
Date: [YYYY-MM-DD HH:MM:SS]
Version: [version number]
Deployed by: [name]
Duration: [minutes]
Status: [SUCCESS/FAILED/ROLLED_BACK]

Components Updated:
- Backend Service: v11.3.1 → v11.3.2
- Database: Migration 0042 applied
- Configuration: Updated JVM heap from 24GB to 32GB

Issues Encountered:
- [List any issues and resolutions]

Rollback: [NO/YES - if yes, explain why]

Sign-off:
- Tech Lead: [name]
- DevOps: [name]
- QA: [name]
```

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Tech Lead | | | @tech-lead |
| DevOps | | | @devops |
| Database Admin | | | @dba |
| On-Call Engineer | | | @oncall |

## Notes

- Always deploy to dev4 first, then production
- Deployments should be during low-traffic windows
- Keep communication channels open during deployment
- Document any deviations from this checklist
- Update checklist based on lessons learned
- Automated deployments should follow same steps
- Zero-downtime deployments require blue-green setup

## Success Metrics

A deployment is considered successful when:
- ✅ All health checks pass
- ✅ Error rate < 0.1%
- ✅ Performance metrics within SLA
- ✅ No rollback required
- ✅ Monitoring shows normal activity
- ✅ No customer complaints for 1 hour

## Rollback Success Metrics

A rollback is considered successful when:
- ✅ Previous version restored within 5 minutes
- ✅ All functionality working as before
- ✅ Data integrity maintained
- ✅ No data loss
- ✅ Root cause identified and documented
