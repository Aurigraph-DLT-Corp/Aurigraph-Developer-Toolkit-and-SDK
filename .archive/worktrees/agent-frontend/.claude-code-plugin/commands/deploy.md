# /deploy

Deploy Aurigraph application to remote server with automatic health checks and rollback.

## Usage

```bash
/deploy [environment] [options]
```

## Parameters

- `environment` (required): Target environment (`dev4`, `staging`, `production`)
- `--skip-tests`: Skip test execution before deployment
- `--skip-backup`: Skip backup of current deployment (not recommended)
- `--force`: Force deployment even if health checks fail

## Examples

```bash
# Deploy to production with all checks
/deploy production

# Deploy to dev4 without tests
/deploy dev4 --skip-tests

# Force deploy to staging
/deploy staging --force
```

## Implementation

When this command is executed, perform the following steps:

### 1. Pre-Deployment Validation

- Verify current working directory is an Aurigraph project
- Check for uncommitted changes in Git
- Confirm target environment configuration exists
- Load environment-specific credentials from `.env` or Credentials.md

### 2. Build Phase

```bash
# Clean and compile
./mvnw clean compile

# Run tests (unless --skip-tests)
if [ "$SKIP_TESTS" != "true" ]; then
  ./mvnw test
fi

# Package application
./mvnw package -DskipTests
```

### 3. Remote Backup

```bash
# SSH to remote server
ssh $REMOTE_USER@$REMOTE_HOST -p $REMOTE_PORT

# Create timestamped backup
cd $REMOTE_DEPLOY_PATH
cp $JAR_NAME $JAR_NAME.backup-$(date +%Y%m%d-%H%M%S)
```

### 4. Service Shutdown

```bash
# Find running process
PID=$(ps aux | grep $JAR_NAME | grep -v grep | awk '{print $2}')

# Graceful shutdown
kill -15 $PID
sleep 5

# Force kill if still running
if ps -p $PID > /dev/null; then
  kill -9 $PID
fi
```

### 5. Deploy New Version

```bash
# Upload new JAR
scp target/$JAR_NAME $REMOTE_USER@$REMOTE_HOST:$REMOTE_DEPLOY_PATH/

# Set permissions
ssh $REMOTE_USER@$REMOTE_HOST "chmod 755 $REMOTE_DEPLOY_PATH/$JAR_NAME"
```

### 6. Service Startup

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

### 7. Health Check

```bash
# Wait for service to start
sleep 10

# Check health endpoint
for i in {1..30}; do
  if curl -f http://localhost:9003/q/health; then
    echo "✅ Service healthy"
    exit 0
  fi
  sleep 2
done
```

### 8. Rollback on Failure

If health check fails:

```bash
# Stop failed deployment
kill -9 $(ps aux | grep $JAR_NAME | grep -v grep | awk '{print $2}')

# Restore backup
LATEST_BACKUP=$(ls -t $JAR_NAME.backup-* | head -1)
cp $LATEST_BACKUP $JAR_NAME

# Restart with backup
nohup java [same JVM settings] -jar $JAR_NAME > logs/application.log 2>&1 &

# Verify backup is healthy
sleep 10
curl -f http://localhost:9003/q/health || echo "❌ Rollback failed - manual intervention required"
```

### 9. Post-Deployment

```bash
# Display deployment summary
echo "=================="
echo "Deployment Summary"
echo "=================="
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo "Deployed at: $(date)"
echo "Service PID: $(ps aux | grep $JAR_NAME | grep -v grep | awk '{print $2}')"
echo "Health: http://$REMOTE_HOST:9003/q/health"
echo "Logs: $REMOTE_DEPLOY_PATH/logs/application.log"

# Create deployment record
echo "[$(date)] Deployed $VERSION to $ENVIRONMENT" >> deployments.log
```

## Environment-Specific Settings

### dev4
- Host: `dlt.aurigraph.io`
- Port: `9003`
- JVM: `-Xms8g -Xmx16g`
- Profile: `dev`

### staging
- Host: `staging.aurigraph.io`
- Port: `9003`
- JVM: `-Xms16g -Xmx32g`
- Profile: `staging`

### production
- Host: `dlt.aurigraph.io`
- Port: `9003`
- JVM: `-Xms16g -Xmx32g`
- Profile: `prod`
- **Requires**: Manual confirmation before deployment

## Success Criteria

- ✅ Build completes without errors
- ✅ Tests pass (if not skipped)
- ✅ Backup created successfully
- ✅ New version uploaded
- ✅ Service starts within 30 seconds
- ✅ Health endpoint returns 200 OK
- ✅ No errors in application logs

## Rollback Triggers

- ❌ Health check fails after 60 seconds
- ❌ Service crashes within first minute
- ❌ Critical errors in startup logs
- ❌ Port binding fails

## Monitoring

After deployment, monitor for 5 minutes:
- CPU usage
- Memory consumption
- Error rate in logs
- Response time for health endpoint

## Notifications

Send deployment notification to:
- Slack channel (if configured)
- Email (if configured)
- Console output

Format:
```
🚀 Deployment to [ENVIRONMENT]
Version: [VERSION]
Status: [SUCCESS/FAILED]
Time: [TIMESTAMP]
Deployed by: Claude Code
```

## Troubleshooting

Common issues:

1. **Port already in use**: Kill existing process
2. **Permission denied**: Check file permissions and user
3. **Out of memory**: Increase JVM heap settings
4. **Connection refused**: Check firewall and network
5. **Health check timeout**: Increase wait time or check logs

## Notes

- Always test in dev4 before production
- Keep at least 3 backup versions
- Monitor logs for first 5 minutes after deployment
- Document any manual steps required
- Update version in Git tags
