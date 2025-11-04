# 🚀 SPRINT 16 PRODUCTION DEPLOYMENT GUIDE

**Date:** November 4, 2025
**Target:** Production server at dlt.aurigraph.io
**Status:** Ready for Manual Execution

---

## 📋 DEPLOYMENT OVERVIEW

This guide provides step-by-step instructions for deploying Aurigraph V11 to the production server (dlt.aurigraph.io:2235).

**Deployment Architecture:**
```
Local Machine (Development)
       ↓
  Build JAR (30 min)
       ↓
  SCP Transfer (5 min)
       ↓
dlt.aurigraph.io
  └─ systemd service
  └─ Java 21 runtime
  └─ Port 9003 (REST API)
  └─ Port 9004 (gRPC)
```

**Estimated Total Time:** 40-50 minutes

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before starting, verify:

- [ ] Working directory: `aurigraph-av10-7/aurigraph-v11-standalone/`
- [ ] Maven installed: `./mvnw --version` (requires JDK 21+)
- [ ] SSH access configured: `ssh -p 2235 subbu@dlt.aurigraph.io`
- [ ] ~30 GB free disk space (for build + JAR)
- [ ] Network connection stable
- [ ] No interruptions planned (30-50 min process)

---

## 🔐 CREDENTIALS REQUIRED

**Remote Server Access:**
- **Host:** dlt.aurigraph.io
- **Port:** 2235
- **User:** subbu
- **Password:** subbuFuture@2025
- **Directory:** /opt/aurigraph/v11

**Or SSH Key:**
```bash
ssh-copy-id -p 2235 subbu@dlt.aurigraph.io
```

---

## 🛠️ STEP 1: BUILD THE JAR (30 minutes)

Navigate to V11 directory:

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
```

Build the production JAR:

```bash
./mvnw clean package \
  -DskipTests \
  -Dquarkus.package.jar.type=uber-jar \
  -Dquarkus.package.output-directory=target \
  -q
```

**Expected Output:**
```
[INFO] BUILD SUCCESS
[INFO] Total time: 25-35 minutes
[INFO] Final Size: 1.6GB
```

**Verify JAR was created:**

```bash
ls -lh target/aurigraph-v11-standalone-11.0.0-runner.jar
# Should show: -rw-r--r-- ... 1.6G ... aurigraph-v11-standalone-11.0.0-runner.jar
```

---

## 🔌 STEP 2: TEST SSH CONNECTION (1 minute)

Test connectivity to production server:

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "echo 'Connection successful!' && uname -a"
```

**Expected Output:**
```
Connection successful!
Linux dlt 5.15.0-1055-aws #61-Ubuntu SMP ... x86_64
```

**If connection fails:**

```bash
# Option 1: Use password authentication
ssh -p 2235 -o PasswordAuthentication=yes subbu@dlt.aurigraph.io "echo 'test'"
# Password: subbuFuture@2025

# Option 2: Add SSH key
ssh-copy-id -p 2235 subbu@dlt.aurigraph.io
# Then enter password when prompted
```

---

## 📂 STEP 3: CREATE DEPLOYMENT DIRECTORY (1 minute)

Create and verify deployment directory on remote:

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "mkdir -p /opt/aurigraph/v11 && ls -la /opt/aurigraph/"
```

**Expected Output:**
```
total 56
drwxr-xr-x  3 subbu subbu  4096 Nov  4 08:00 .
drwxr-xr-x  8 root  root   4096 Oct 20 15:30 ..
drwxr-xr-x  2 subbu subbu  4096 Nov  4 08:00 v11
```

---

## 🛑 STEP 4: STOP EXISTING SERVICE (1 minute)

Stop any existing V11 service:

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "pkill -f 'aurigraph-v11-standalone' || echo 'No existing service'"
```

**Verify service stopped:**

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "curl -s http://localhost:9003/api/v11/health || echo 'Service stopped'"
```

---

## 📤 STEP 5: COPY JAR TO PRODUCTION (5-10 minutes)

Transfer the JAR to production server:

```bash
scp -P 2235 target/aurigraph-v11-standalone-11.0.0-runner.jar \
    subbu@dlt.aurigraph.io:/opt/aurigraph/v11/
```

**Expected Output:**
```
aurigraph-v11-standalone-11.0.0-runner.jar  100% 1.6GB  15.3MB/s  1:45
```

**Verify file arrived:**

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "ls -lh /opt/aurigraph/v11/"
# Should show: -rw-r--r-- ... 1.6G ... aurigraph-v11-standalone-11.0.0-runner.jar
```

---

## 🚀 STEP 6: INSTALL & START SERVICE (5 minutes)

Create and install systemd service:

```bash
# Step 6a: Create systemd service file locally
cat > /tmp/aurigraph-v11.service <<'EOF'
[Unit]
Description=Aurigraph V11 Blockchain Platform
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/opt/aurigraph/v11
ExecStart=/usr/bin/java \
  -Xmx4g \
  -Xms2g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Dquarkus.http.port=9003 \
  -Dquarkus.grpc.server.port=9004 \
  -jar /opt/aurigraph/v11/aurigraph-v11-standalone-11.0.0-runner.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Step 6b: Copy to remote
scp -P 2235 /tmp/aurigraph-v11.service subbu@dlt.aurigraph.io:/tmp/

# Step 6c: Install and start service
ssh -p 2235 subbu@dlt.aurigraph.io <<'ENDSSH'
# Install systemd service
sudo mv /tmp/aurigraph-v11.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-v11.service
sudo systemctl start aurigraph-v11.service

# Wait for startup
sleep 5

# Show status
sudo systemctl status aurigraph-v11.service --no-pager
ENDSSH
```

---

## ✅ STEP 7: VERIFY DEPLOYMENT (2 minutes)

Test health endpoints:

```bash
# Health check
ssh -p 2235 subbu@dlt.aurigraph.io "curl -s http://localhost:9003/q/health | jq ."

# API health
ssh -p 2235 subbu@dlt.aurigraph.io "curl -s http://localhost:9003/api/v11/health"

# System info
ssh -p 2235 subbu@dlt.aurigraph.io "curl -s http://localhost:9003/api/v11/info | jq ."
```

**Expected Health Response:**
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Database",
      "status": "UP"
    },
    {
      "name": "HTTP",
      "status": "UP"
    }
  ]
}
```

---

## 📊 DEPLOYMENT SUMMARY

Display full deployment status:

```bash
ssh -p 2235 subbu@dlt.aurigraph.io <<'ENDSSH'
echo "=================================="
echo "Aurigraph V11 Production Status"
echo "=================================="
echo ""

echo "🔵 Service Status:"
sudo systemctl status aurigraph-v11.service --no-pager | grep -E "Active|Loaded|Memory"

echo ""
echo "📊 Process Info:"
ps aux | grep aurigraph | grep -v grep

echo ""
echo "🌐 Network Ports:"
netstat -tuln | grep -E "9003|9004"

echo ""
echo "💾 Disk Usage:"
du -sh /opt/aurigraph/v11/

echo ""
echo "🔍 Recent Logs (last 20):"
sudo journalctl -u aurigraph-v11 -n 20 --no-pager
ENDSSH
```

---

## 🌐 API ENDPOINTS (After Successful Deployment)

Once deployed, these endpoints are available:

**Health & Status:**
- Health:  `http://dlt.aurigraph.io:9003/q/health`
- API Health: `http://dlt.aurigraph.io:9003/api/v11/health`
- Status: `http://dlt.aurigraph.io:9003/api/v11/status`
- Info: `http://dlt.aurigraph.io:9003/api/v11/info`

**Performance:**
- Performance: `http://dlt.aurigraph.io:9003/api/v11/performance`
- TPS Stats: `http://dlt.aurigraph.io:9003/api/v11/stats`

**Blockchain:**
- Crypto Status: `http://dlt.aurigraph.io:9003/api/v11/crypto/status`
- Consensus: `http://dlt.aurigraph.io:9003/api/v11/consensus/status`

**Monitoring:**
- Metrics: `http://dlt.aurigraph.io:9003/q/metrics`

---

## 🔧 USEFUL POST-DEPLOYMENT COMMANDS

**View Live Logs:**
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11 -f'
```

**Restart Service:**
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo systemctl restart aurigraph-v11'
```

**Stop Service:**
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo systemctl stop aurigraph-v11'
```

**Check Service Status:**
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo systemctl status aurigraph-v11'
```

**Check Memory Usage:**
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'ps aux | grep java'
```

**Test API Response Time:**
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'curl -w "\nTime: %{time_total}s\n" -s http://localhost:9003/api/v11/health'
```

---

## 🐛 TROUBLESHOOTING

### Problem: JAR Build Fails

**Symptom:** BUILD FAILURE during `mvnw package`

**Solution:**
```bash
# Clean and retry
./mvnw clean package -DskipTests -q

# Or with verbose output to see error:
./mvnw clean package -DskipTests
```

### Problem: SSH Connection Refused

**Symptom:** `ssh: connect to host dlt.aurigraph.io port 2235: Connection refused`

**Solution:**
```bash
# Check if server is online
ping dlt.aurigraph.io

# Try with verbose SSH
ssh -v -p 2235 subbu@dlt.aurigraph.io "echo test"

# Use password authentication explicitly
ssh -p 2235 -o PasswordAuthentication=yes subbu@dlt.aurigraph.io
```

### Problem: Service Fails to Start

**Symptom:** Service started but crashes immediately

**Solution:**
```bash
# Check logs for errors
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11 -n 50'

# Check if port 9003 is already in use
ssh -p 2235 subbu@dlt.aurigraph.io 'lsof -i :9003'

# Kill existing process if needed
ssh -p 2235 subbu@dlt.aurigraph.io 'pkill -9 java'
```

### Problem: Health Check Fails

**Symptom:** Service running but health endpoint returns error

**Solution:**
```bash
# Wait longer for startup (up to 30 seconds)
ssh -p 2235 subbu@dlt.aurigraph.io 'sleep 30 && curl http://localhost:9003/api/v11/health'

# Check application logs
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11 | tail -100'

# Check database connectivity
ssh -p 2235 subbu@dlt.aurigraph.io 'curl -s http://localhost:9003/api/v11/status'
```

---

## 📈 PERFORMANCE EXPECTATIONS

After successful deployment:

- **Startup Time:** 30-60 seconds
- **Health Check:** ~10ms response time
- **TPS Capability:** 776K+ (v11 current level)
- **Memory Usage:** 3-4 GB (configured with -Xmx4g)
- **CPU Usage:** 40-60% at idle

---

## ✨ POST-DEPLOYMENT VERIFICATION

Run these checks to confirm successful deployment:

```bash
#!/bin/bash
# Comprehensive deployment verification script

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"

echo "🔍 Verifying Aurigraph V11 Production Deployment"
echo ""

# 1. Service Status
echo "✓ Service Status:"
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'sudo systemctl is-active aurigraph-v11'

# 2. Health Check
echo "✓ Health Check:"
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'curl -s http://localhost:9003/q/health' | head -5

# 3. API Response
echo "✓ API Response Time:"
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'curl -w "Total: %{time_total}s\n" -s http://localhost:9003/api/v11/health'

# 4. Memory Usage
echo "✓ Memory Usage:"
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'ps aux | grep java | grep -v grep | awk "{print \$6}"'

# 5. Disk Space
echo "✓ Disk Space:"
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'df -h /opt/aurigraph/v11 | tail -1'

echo ""
echo "✅ Deployment verification complete!"
```

---

## 📝 ROLLBACK PROCEDURE

If issues occur after deployment:

```bash
# Stop the service
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo systemctl stop aurigraph-v11'

# Remove current JAR
ssh -p 2235 subbu@dlt.aurigraph.io 'rm /opt/aurigraph/v11/aurigraph-v11-standalone-11.0.0-runner.jar'

# Deploy previous version (if available) or
# Contact team for assistance
```

---

## 🎯 NEXT STEPS

After successful deployment:

1. ✅ Monitor logs for 24 hours
2. ✅ Run performance benchmarks
3. ✅ Update monitoring dashboards
4. ✅ Notify team of production status
5. ✅ Document any issues

---

## 📞 SUPPORT

For deployment assistance:
- Check logs: `ssh -p 2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11'`
- Verify endpoints: `curl http://dlt.aurigraph.io:9003/api/v11/health`
- Contact: Aurigraph DevOps Team

---

**Status:** ✅ Ready for Production Deployment
**Created:** November 4, 2025
**Version:** 1.0.0
