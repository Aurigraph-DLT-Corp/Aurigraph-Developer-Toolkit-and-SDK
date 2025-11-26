# Aurigraph V11 Production Deployment - Manual Steps

## Prerequisites
- ✅ JAR built: `target/aurigraph-v11-standalone-11.0.0-runner.jar` (1.6GB)
- ✅ Git committed and pushed to main branch
- ✅ SSH access to dlt.aurigraph.io:2235

## Server Credentials
- **Host**: dlt.aurigraph.io
- **Port**: 2235
- **User**: subbu
- **Password**: subbuFuture@2025

---

## Deployment Steps

### Step 1: Create Deployment Directory
Open your terminal and run:
```bash
ssh -p2235 subbu@dlt.aurigraph.io "mkdir -p /opt/aurigraph/v11 && ls -la /opt/aurigraph/"
```
**Password**: `subbuFuture@2025`

---

### Step 2: Stop Any Existing V11 Service
```bash
ssh -p2235 subbu@dlt.aurigraph.io "pkill -f 'aurigraph-v11-standalone' || echo 'No service running'"
```

---

### Step 3: Copy JAR to Production Server
This will take 2-5 minutes for the 1.6GB file:
```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

scp -P 2235 target/aurigraph-v11-standalone-11.0.0-runner.jar \
    subbu@dlt.aurigraph.io:/opt/aurigraph/v11/
```

**Expected output**: Progress bar showing file transfer (1.6GB)

---

### Step 4: Create Systemd Service File

Create the service file locally:
```bash
cat > /tmp/aurigraph-v11.service <<'EOF'
[Unit]
Description=Aurigraph V11 Blockchain Platform
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/opt/aurigraph/v11
ExecStart=/usr/bin/java -Xmx4g -Xms2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Dquarkus.http.port=9003 -Dquarkus.grpc.server.port=9004 -jar /opt/aurigraph/v11/aurigraph-v11-standalone-11.0.0-runner.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

Copy to remote server:
```bash
scp -P 2235 /tmp/aurigraph-v11.service subbu@dlt.aurigraph.io:/tmp/
```

---

### Step 5: Install and Start Service

SSH into the server:
```bash
ssh -p2235 subbu@dlt.aurigraph.io
```

Then run these commands on the remote server:
```bash
# Install systemd service
sudo mv /tmp/aurigraph-v11.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-v11.service
sudo systemctl start aurigraph-v11.service

# Check service status
sudo systemctl status aurigraph-v11.service

# View real-time logs
sudo journalctl -u aurigraph-v11 -f
```

**Expected output**: Service should show as "active (running)"

---

### Step 6: Verify Deployment

From your local machine, test the endpoints:

```bash
# Health check
curl http://dlt.aurigraph.io:9003/api/v11/health

# System info
curl http://dlt.aurigraph.io:9003/api/v11/info

# Platform status
curl http://dlt.aurigraph.io:9003/api/v11/status

# Performance metrics
curl http://dlt.aurigraph.io:9003/api/v11/performance

# AI optimization stats
curl http://dlt.aurigraph.io:9003/api/v11/ai/stats

# Quantum crypto status
curl http://dlt.aurigraph.io:9003/api/v11/crypto/status

# Prometheus metrics
curl http://dlt.aurigraph.io:9003/q/metrics
```

---

## Alternative: Quick Start (No Systemd)

If you want to start V11 quickly without systemd:

```bash
ssh -p2235 subbu@dlt.aurigraph.io

cd /opt/aurigraph/v11

# Start in background with nohup
nohup java -Xmx4g -Xms2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
  -Dquarkus.http.port=9003 \
  -Dquarkus.grpc.server.port=9004 \
  -jar aurigraph-v11-standalone-11.0.0-runner.jar > v11.log 2>&1 &

# Get process ID
echo $! > v11.pid

# View logs
tail -f v11.log
```

To stop:
```bash
kill $(cat /opt/aurigraph/v11/v11.pid)
```

---

## Useful Management Commands

### Service Management
```bash
# View logs
ssh -p2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11 -f'

# Restart service
ssh -p2235 subbu@dlt.aurigraph.io 'sudo systemctl restart aurigraph-v11'

# Stop service
ssh -p2235 subbu@dlt.aurigraph.io 'sudo systemctl stop aurigraph-v11'

# Check service status
ssh -p2235 subbu@dlt.aurigraph.io 'sudo systemctl status aurigraph-v11'
```

### Server Monitoring
```bash
# Check if V11 is listening on port 9003
ssh -p2235 subbu@dlt.aurigraph.io 'sudo netstat -tlnp | grep 9003'

# Check Java processes
ssh -p2235 subbu@dlt.aurigraph.io 'ps aux | grep aurigraph-v11'

# Monitor memory usage
ssh -p2235 subbu@dlt.aurigraph.io 'free -h && top -b -n 1 | head -20'

# Check disk space
ssh -p2235 subbu@dlt.aurigraph.io 'df -h /opt/aurigraph'
```

---

## Troubleshooting

### Service won't start
```bash
# Check for errors in logs
sudo journalctl -u aurigraph-v11 -n 100 --no-pager

# Check if port is already in use
sudo netstat -tlnp | grep 9003

# Verify Java version
java --version  # Should be Java 21+

# Check JAR file exists and is readable
ls -lh /opt/aurigraph/v11/aurigraph-v11-standalone-11.0.0-runner.jar
```

### Out of Memory
```bash
# Increase heap size in systemd service file
sudo nano /etc/systemd/system/aurigraph-v11.service

# Change: -Xmx4g to -Xmx8g (if you have enough RAM)
# Then:
sudo systemctl daemon-reload
sudo systemctl restart aurigraph-v11
```

### Permission Issues
```bash
# Ensure correct ownership
sudo chown -R subbu:subbu /opt/aurigraph/v11
sudo chmod 755 /opt/aurigraph/v11
sudo chmod 644 /opt/aurigraph/v11/*.jar
```

---

## Post-Deployment Checklist

- [ ] Service is running (`systemctl status aurigraph-v11`)
- [ ] Health endpoint returns 200 OK
- [ ] Logs show no errors
- [ ] Port 9003 is accessible externally
- [ ] gRPC port 9004 is accessible
- [ ] Metrics are being collected
- [ ] Performance meets expectations (test with load)
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Document any configuration changes

---

## Performance Benchmarking

After deployment, run performance tests:

```bash
# Simple throughput test
curl -X POST http://dlt.aurigraph.io:9003/api/v11/performance \
  -H "Content-Type: application/json" \
  -d '{"testDuration": 60, "targetTPS": 1000000}'

# AI optimization performance
curl http://dlt.aurigraph.io:9003/api/v11/ai/stats

# Quantum crypto performance
curl -X POST http://dlt.aurigraph.io:9003/api/v11/crypto/status
```

---

## Rollback Procedure

If you need to rollback:

```bash
# Stop V11
sudo systemctl stop aurigraph-v11

# Backup current JAR
sudo mv /opt/aurigraph/v11/aurigraph-v11-standalone-11.0.0-runner.jar \
        /opt/aurigraph/v11/aurigraph-v11-standalone-11.0.0-runner.jar.backup

# Restore previous version (if available)
# Or redeploy from git tag

# Restart
sudo systemctl start aurigraph-v11
```

---

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch logs and metrics
2. **Run load tests** - Validate 2M+ TPS target
3. **Update DNS** - If needed for production domain
4. **Configure firewall** - Ensure ports 9003, 9004 are open
5. **Set up backups** - Regular JAR and config backups
6. **Enable monitoring** - Grafana dashboards, alerts
7. **Document any issues** - Create JIRA tickets for improvements

---

## Contact & Support

- **JIRA**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Documentation**: BUILD-FIXES-SUMMARY-2025-10-03.md

---

**Deployment Guide Version**: 1.0
**Created**: October 3, 2025
**Server**: dlt.aurigraph.io:2235
**Application**: Aurigraph V11 Standalone (11.0.0)
**JAR Size**: 1.6GB
