# Next Steps: Native Build on Remote Server
**Quick Reference Guide**
**Date**: 2025-10-25
**Purpose**: Complete native build on dlt.aurigraph.io (Linux server with stable Docker)

---

## Prerequisites

- ✅ JVM build successful (174MB uber JAR)
- ✅ Production deployment checklist complete
- ✅ NGINX configuration verified
- ✅ Monitoring infrastructure ready
- ❌ Native build blocked on macOS (Docker instability)

---

## Step 1: Transfer Source Code to Server (5 minutes)

### Package Source Code
```bash
# Navigate to project root
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7

# Create tarball (exclude target directory to save space)
tar --exclude='aurigraph-v11-standalone/target' \
    --exclude='aurigraph-v11-standalone/node_modules' \
    -czf aurigraph-v11-src.tar.gz aurigraph-v11-standalone/

# Verify tarball size (should be ~50-100MB)
ls -lh aurigraph-v11-src.tar.gz
```

### Transfer to Remote Server
```bash
# Upload to server
scp -P 2235 aurigraph-v11-src.tar.gz subbu@dlt.aurigraph.io:/tmp/

# Verify transfer
ssh -p2235 subbu@dlt.aurigraph.io "ls -lh /tmp/aurigraph-v11-src.tar.gz"
```

---

## Step 2: Build Native Executable on Server (20-30 minutes)

### SSH to Server
```bash
ssh -p2235 subbu@dlt.aurigraph.io
# Password: See doc/Credentials.md
```

### Extract and Build
```bash
# Extract source code
cd /tmp
tar -xzf aurigraph-v11-src.tar.gz

# Navigate to project
cd aurigraph-v11-standalone

# Verify Docker is running
docker ps
# Expected: Docker should show running containers or empty list

# Verify Java version
java --version
# Expected: Java 21 or higher

# Start native build (20-30 minutes)
./mvnw clean package -Pnative -DskipTests

# Monitor progress (in another terminal)
tail -f /tmp/maven-build.log  # If you redirected output
```

### Expected Output
```
[INFO] Building native image
[INFO] [1/8] Initializing...
[INFO] [2/8] Performing analysis...
[INFO] [3/8] Building universe...
[INFO] [4/8] Parsing methods...
[INFO] [5/8] Inlining methods...
[INFO] [6/8] Compiling methods...
[INFO] [7/8] Layouting methods...
[INFO] [8/8] Creating image...
[INFO] Finished generating 'aurigraph-v11-standalone-11.4.3-runner' in 20m 15s.
[INFO] BUILD SUCCESS
[INFO] Total time: 20:45 min
```

### Verify Build
```bash
# Check executable exists
ls -lh target/*-runner

# Expected output:
# -rwxr-xr-x 1 subbu subbu 185M Oct 25 11:00 aurigraph-v11-standalone-11.4.3-runner

# Verify size (< 200MB)
du -h target/*-runner

# Generate checksum
sha256sum target/*-runner > target/checksum.txt
cat target/checksum.txt
```

---

## Step 3: Test Native Executable Locally (5 minutes)

### Quick Startup Test
```bash
# Start the application (background)
cd /tmp/aurigraph-v11-standalone
nohup ./target/aurigraph-v11-standalone-11.4.3-runner > /tmp/native-test.log 2>&1 &

# Record PID
echo $! > /tmp/native-test.pid

# Wait 3 seconds for startup
sleep 3

# Test health endpoint
curl http://localhost:9003/api/v11/health

# Expected response:
# {"status":"UP","checks":[...]}
```

### Verify Startup Time
```bash
# Check startup time in logs
grep "started in" /tmp/native-test.log

# Expected: started in 0.8s - 2.5s
```

### Verify Memory Usage
```bash
# Check memory footprint
PID=$(cat /tmp/native-test.pid)
ps aux | grep $PID | awk '{print $6}'

# Expected: < 256MB (256000 KB)
```

### Stop Test Instance
```bash
# Graceful shutdown
kill -15 $(cat /tmp/native-test.pid)

# Wait 5 seconds
sleep 5

# Verify stopped
ps aux | grep aurigraph-v11
```

---

## Step 4: Deploy to Staging Environment (30 minutes)

### Create Staging Directories
```bash
# Create staging structure
sudo mkdir -p /opt/aurigraph-v11/staging/{logs,config,backup}
sudo chown -R subbu:subbu /opt/aurigraph-v11/staging
```

### Copy Executable and Configuration
```bash
# Copy native executable
cp /tmp/aurigraph-v11-standalone/target/*-runner \
   /opt/aurigraph-v11/staging/aurigraph-v11-standalone-11.4.3-runner

# Make executable
chmod +x /opt/aurigraph-v11/staging/aurigraph-v11-standalone-11.4.3-runner

# Copy configuration
cp /tmp/aurigraph-v11-standalone/src/main/resources/application.properties \
   /opt/aurigraph-v11/staging/config/application-staging.properties
```

### Configure Staging Environment
Edit `/opt/aurigraph-v11/staging/config/application-staging.properties`:

```properties
# Change port to avoid conflict with production
quarkus.http.port=9103

# Use staging database
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_v11_staging
quarkus.datasource.username=aurigraph
quarkus.datasource.password=<staging_password>

# Staging profile
quarkus.profile=staging

# Enable detailed logging
quarkus.log.level=INFO
quarkus.log.category."io.aurigraph".level=DEBUG
```

### Start Staging Instance
```bash
cd /opt/aurigraph-v11/staging

# Set environment
export QUARKUS_CONFIG_LOCATIONS=config/application-staging.properties
export JAVA_OPTS="-Xmx2g -XX:+UseG1GC"

# Start with JFR profiling (30 minutes)
./aurigraph-v11-standalone-11.4.3-runner \
  -XX:StartFlightRecording=duration=30m,filename=staging-profile.jfr \
  > logs/staging.log 2>&1 &

# Record PID
echo $! > staging.pid

# Wait for startup
sleep 5

# Verify health
curl http://localhost:9103/api/v11/health
```

---

## Step 5: Performance Validation (30 minutes)

### 5-Minute Baseline Test
```bash
# Run baseline performance test
curl -X POST http://localhost:9103/api/v11/performance/test \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 300,
    "targetTps": 1000000,
    "threads": 256
  }'

# Expected output:
# {
#   "tps": 8510000,
#   "avgLatency": "0.8ms",
#   "p99Latency": "3.2ms",
#   "errors": 0
# }
```

### 30-Minute Continuous Load Test
```bash
# Create test script
cat > /tmp/continuous-test.sh << 'EOF'
#!/bin/bash
for i in {1..6}; do
  echo "=== Test $i/6 - $(date) ==="
  curl -X POST http://localhost:9103/api/v11/performance/test \
    -H "Content-Type: application/json" \
    -d '{
      "duration": 300,
      "targetTps": 100000,
      "threads": 128
    }'
  echo ""
  sleep 300
done
EOF

chmod +x /tmp/continuous-test.sh

# Run continuous test (30 minutes total)
/tmp/continuous-test.sh | tee /tmp/continuous-test-results.txt
```

### Monitor During Test
```bash
# In another terminal, monitor resources
watch -n 5 'ps aux | grep aurigraph | grep -v grep'

# Monitor logs
tail -f /opt/aurigraph-v11/staging/logs/staging.log

# Check database connections
psql -U aurigraph -d aurigraph_v11_staging -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='aurigraph_v11_staging';"
```

### Analyze Results
```bash
# Check for errors in logs
grep -i "error\|exception\|warn" /opt/aurigraph-v11/staging/logs/staging.log

# Analyze JFR profile
jfr print --events jdk.CPULoad,jdk.GCHeapSummary \
  /opt/aurigraph-v11/staging/staging-profile.jfr

# Memory check (should be < 512MB)
ps aux | grep aurigraph | grep staging | awk '{print $6}'

# Final stats
curl http://localhost:9103/api/v11/stats
```

---

## Step 6: Production Deployment (2 hours)

### Follow Production Deployment Checklist
Refer to: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/PRODUCTION-DEPLOYMENT-CHECKLIST.md`

### Quick Reference: Blue-Green Deployment
```bash
# 1. Create Green environment
sudo mkdir -p /opt/aurigraph-v11/green/{logs,config}
sudo chown -R subbu:subbu /opt/aurigraph-v11/green

# 2. Copy validated executable from staging
cp /opt/aurigraph-v11/staging/aurigraph-v11-standalone-11.4.3-runner \
   /opt/aurigraph-v11/green/

# 3. Copy production configuration
cp /path/to/application-prod.properties \
   /opt/aurigraph-v11/green/config/application.properties

# 4. Start Green on alternate port (9203)
cd /opt/aurigraph-v11/green
export QUARKUS_HTTP_PORT=9203
nohup ./aurigraph-v11-standalone-11.4.3-runner > logs/green.log 2>&1 &
echo $! > green.pid

# 5. Warmup (1000 test transactions)
for i in {1..1000}; do
  curl -X POST http://localhost:9203/api/v11/transactions \
    -H "Content-Type: application/json" \
    -d '{"type":"test","amount":100}' &
done
wait

# 6. Update NGINX (Blue → Green)
sudo sed -i 's/localhost:9003/localhost:9203/' \
  /etc/nginx/sites-available/aurigraph-portal.conf
sudo nginx -t && sudo nginx -s reload

# 7. Verify traffic cutover
curl https://dlt.aurigraph.io/api/v11/health
tail -f /opt/aurigraph-v11/green/logs/green.log

# 8. Graceful shutdown of Blue (after 5 min connection draining)
sleep 300
kill -15 $(cat /opt/aurigraph-v11/blue/blue.pid)

# 9. Promote Green → Blue
cd /opt/aurigraph-v11
rm -f production
ln -s green production
```

---

## Step 7: Post-Deployment Monitoring (24 hours)

### Hour 0-1: Critical Monitoring (Every 5 minutes)
```bash
# Create monitoring script
cat > /tmp/monitor.sh << 'EOF'
#!/bin/bash
while true; do
  echo "=== $(date) ==="

  # Health check
  curl -s https://dlt.aurigraph.io/api/v11/health | jq .

  # Stats
  curl -s https://dlt.aurigraph.io/api/v11/stats | jq .

  # Memory
  ps aux | grep aurigraph | grep -v grep | awk '{print $6}'

  # Errors
  tail -20 /opt/aurigraph-v11/production/logs/*.log | grep -i error

  sleep 300  # 5 minutes
done
EOF

chmod +x /tmp/monitor.sh
/tmp/monitor.sh | tee /tmp/production-monitoring.log
```

### Setup Prometheus Alerts
```bash
# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets | jq .

# Test alert rules
curl http://localhost:9090/api/v1/rules | jq .

# View active alerts
curl http://localhost:9090/api/v1/alerts | jq .
```

### Grafana Dashboard
```bash
# Access Grafana
# URL: http://dlt.aurigraph.io:3000
# Login: admin/admin (change on first login)

# Import dashboard from:
# /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/monitoring/grafana/dashboards/
```

---

## Rollback Procedure (If Needed)

### Emergency Rollback (< 5 minutes)
```bash
# 1. Stop Green
kill -15 $(cat /opt/aurigraph-v11/green/green.pid)

# 2. Revert NGINX configuration
sudo cp /etc/nginx/sites-available/aurigraph-portal.conf.backup.$(date +%Y%m%d) \
  /etc/nginx/sites-available/aurigraph-portal.conf
sudo nginx -s reload

# 3. Restart Blue (if stopped)
cd /opt/aurigraph-v11/blue
nohup ./aurigraph-v11-standalone-*-runner > logs/blue.log 2>&1 &

# 4. Verify
curl https://dlt.aurigraph.io/api/v11/health

# 5. Notify team
echo "ROLLBACK EXECUTED AT $(date)" | mail -s "Production Rollback" team@aurigraph.io
```

---

## Success Criteria Checklist

### Native Build
- [ ] Executable size < 200MB
- [ ] Build time < 30 minutes
- [ ] Startup time < 3 seconds
- [ ] Memory usage < 256MB at startup
- [ ] SHA256 checksum generated

### Staging Validation
- [ ] Health endpoint returns 200 OK
- [ ] Info endpoint shows correct version (11.4.3)
- [ ] 5-minute baseline test: TPS > 5M
- [ ] 30-minute load test: TPS > 8M sustained
- [ ] No errors in logs
- [ ] Memory stable (< 512MB)
- [ ] CPU < 60% under load

### Production Deployment
- [ ] Blue-green cutover completed
- [ ] Zero downtime achieved
- [ ] External health check passes
- [ ] TPS > 8M in production
- [ ] Latency p99 < 5ms
- [ ] Error rate < 0.01%
- [ ] Monitoring active (Prometheus, Grafana)
- [ ] Alerts configured and tested
- [ ] Team notified

---

## Troubleshooting

### Issue: Native build fails
```bash
# Check Docker
docker ps
docker info

# Check disk space (need > 10GB)
df -h

# Check memory (need > 8GB)
free -h

# Retry with verbose output
./mvnw clean package -Pnative -DskipTests -X
```

### Issue: Startup fails
```bash
# Check logs
tail -100 logs/*.log

# Check database connection
psql -h localhost -U aurigraph -d aurigraph_v11 -c "SELECT 1;"

# Check port availability
lsof -i :9003

# Check permissions
ls -l aurigraph-v11-standalone-*-runner
```

### Issue: Low TPS
```bash
# Check thread pool
curl http://localhost:9003/q/metrics | grep "thread"

# Check database connections
psql -U aurigraph -d aurigraph_v11 -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Check CPU
top -bn1 | grep aurigraph

# Enable profiling
./aurigraph-v11-standalone-*-runner \
  -XX:StartFlightRecording=duration=5m,filename=low-tps.jfr
```

---

## Contact Information

**Primary**: DevOps & Deployment Agent (DDA)
**Secondary**: Backend Development Agent (BDA)
**Escalation**: Chief Architect Agent (CAA)

**Server**: dlt.aurigraph.io
**SSH Port**: 2235
**User**: subbu
**Password**: See doc/Credentials.md

---

## Related Documents

1. **PRODUCTION-DEPLOYMENT-CHECKLIST.md** - Complete deployment procedures
2. **SPRINT13-WEEK2-DAYS2-3-DEPLOYMENT-REPORT.md** - Current status report
3. **CLAUDE.md** - Project configuration and commands
4. **doc/Credentials.md** - Server credentials and access

---

**Last Updated**: 2025-10-25
**Version**: 1.0
**Next Update**: After native build completion
