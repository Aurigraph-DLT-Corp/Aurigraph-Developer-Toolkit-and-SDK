# 🚨 PRODUCTION 502 BAD GATEWAY - EMERGENCY FIX GUIDE

**Status:** Production service returning 502 errors
**Issue:** Backend not responding to NGINX proxy
**Severity:** HIGH - Production down
**Fix Time:** 5-15 minutes

---

## 🔍 IMMEDIATE DIAGNOSIS

### What's Happening
- NGINX is running (reverse proxy working)
- V11 backend NOT responding on port 9003
- Service either crashed, not started, or port unavailable

### Symptoms
```
502 Server error on /api/v11/blockchain/stats
502 Server error on /api/v11/system/status
502 Server error on /api/v11/performance
GET https://dlt.aurigraph.io/api/v11/* 502 (Bad Gateway)
```

---

## 🛠️ QUICK FIXES (Try in Order)

### FIX #1: Check Service Status (1 minute)

```bash
# SSH to production
ssh -p 2235 subbu@dlt.aurigraph.io

# Check if service is running
sudo systemctl status aurigraph-v11.service

# Expected output should show:
# Active: active (running)
# If not, you'll see "inactive (dead)"
```

### FIX #2: Restart the Service (2 minutes)

If service is stopped or failing:

```bash
# SSH to production
ssh -p 2235 subbu@dlt.aurigraph.io

# Restart service
sudo systemctl restart aurigraph-v11.service

# Wait for startup
sleep 10

# Check status again
sudo systemctl status aurigraph-v11.service

# Verify it's responding
curl http://localhost:9003/q/health
```

### FIX #3: Check for Port Conflicts (1 minute)

```bash
# SSH to production
ssh -p 2235 subbu@dlt.aurigraph.io

# Check if port 9003 is in use
lsof -i :9003

# If another process is using it, kill it
# (unless it's the Java process we want)
sudo lsof -i :9003 | grep -v java | awk '{print $2}' | xargs kill -9
```

### FIX #4: Check Service Logs (2 minutes)

```bash
# SSH to production
ssh -p 2235 subbu@dlt.aurigraph.io

# View last 50 lines of logs
sudo journalctl -u aurigraph-v11.service -n 50

# View with ERROR filter
sudo journalctl -u aurigraph-v11.service | grep ERROR

# View last 5 minutes
sudo journalctl -u aurigraph-v11.service --since "5 min ago"
```

### FIX #5: Check Disk Space (1 minute)

```bash
# SSH to production
ssh -p 2235 subbu@dlt.aurigraph.io

# Check disk usage
df -h /opt/aurigraph/v11

# If disk is full (>90%), free up space
du -sh /opt/aurigraph/v11/*
```

### FIX #6: Stop and Restart Everything (5 minutes)

If all else fails:

```bash
# SSH to production
ssh -p 2235 subbu@dlt.aurigraph.io

# Stop the service
sudo systemctl stop aurigraph-v11.service

# Wait for shutdown
sleep 5

# Kill any lingering Java processes
pkill -9 java

# Check nothing is on port 9003
lsof -i :9003

# Start the service again
sudo systemctl start aurigraph-v11.service

# Wait for startup (up to 30 seconds)
sleep 30

# Check status
sudo systemctl status aurigraph-v11.service --no-pager

# Test health endpoint
curl http://localhost:9003/q/health
```

---

## 🔍 DIAGNOSTIC CHECKS

### Check 1: Is the JAR file present?

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "ls -lh /opt/aurigraph/v11/"

# Should show:
# -rw-r--r-- ... 1.6G ... aurigraph-v11-standalone-11.0.0-runner.jar
```

### Check 2: Is Java installed and working?

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "java -version"

# Should show Java 21+
```

### Check 3: Check available memory

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "free -h"

# Service needs 4GB minimum
```

### Check 4: View complete service status

```bash
ssh -p 2235 subbu@dlt.aurigraph.io <<'EOF'
echo "=== Service Status ==="
sudo systemctl status aurigraph-v11 --no-pager | head -20

echo ""
echo "=== Process Info ==="
ps aux | grep java | grep -v grep

echo ""
echo "=== Port Status ==="
netstat -tuln | grep -E "9003|9004"

echo ""
echo "=== Recent Logs ==="
sudo journalctl -u aurigraph-v11 -n 30 --no-pager
EOF
```

---

## 🚀 FULL RECOVERY PROCEDURE

If service is completely down:

### Step 1: SSH to Production
```bash
ssh -p 2235 subbu@dlt.aurigraph.io
```

### Step 2: Kill All Java Processes
```bash
pkill -9 java
sleep 2
```

### Step 3: Verify Cleanup
```bash
ps aux | grep java
# Should return empty
```

### Step 4: Start Service
```bash
sudo systemctl start aurigraph-v11.service
```

### Step 5: Wait for Startup (up to 30 seconds)
```bash
for i in {1..30}; do
  if curl -s http://localhost:9003/q/health | grep -q "UP"; then
    echo "✅ Service online!"
    break
  fi
  echo "Attempt $i... waiting for startup"
  sleep 1
done
```

### Step 6: Verify Health
```bash
curl -s http://localhost:9003/q/health | jq .
curl -s http://localhost:9003/api/v11/health | jq .
```

### Step 7: Check NGINX
```bash
# NGINX should now be able to proxy to backend
curl -s http://localhost/q/health  # Through NGINX proxy
```

---

## 🔧 ADVANCED TROUBLESHOOTING

### If service logs show memory errors:
```bash
# Reduce memory usage (default: -Xmx4g)
# Edit systemd service:
sudo nano /etc/systemd/system/aurigraph-v11.service

# Change this line:
# ExecStart=/usr/bin/java -Xmx4g -Xms2g ...
# To this (use less memory):
# ExecStart=/usr/bin/java -Xmx2g -Xms1g ...

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart aurigraph-v11.service
```

### If service logs show database connection errors:
```bash
# Verify database is running
ssh -p 2235 subbu@dlt.aurigraph.io "psql -U aurigraph aurigraph_demos -c 'SELECT 1'"

# If database is down, restart it:
ssh -p 2235 subbu@dlt.aurigraph.io "sudo systemctl restart postgresql"
```

### If service logs show port already in use:
```bash
# Find what's using port 9003
sudo lsof -i :9003

# Kill it (if it's not the right java process)
sudo kill -9 <PID>

# Then restart service
sudo systemctl restart aurigraph-v11.service
```

---

## ✅ VERIFICATION CHECKLIST

After implementing fixes:

- [ ] Service status is "active (running)"
- [ ] `curl http://localhost:9003/q/health` returns `{"status":"UP"}`
- [ ] `curl http://localhost:9003/api/v11/health` returns 2xx status
- [ ] Memory usage is reasonable (check with `ps aux`)
- [ ] Logs show no ERROR messages
- [ ] Portal can reach backend: `curl http://dlt.aurigraph.io:9003/q/health`

---

## 📊 COMMON CAUSES & SOLUTIONS

| Issue | Cause | Solution |
|-------|-------|----------|
| Service not running | Crashed or not started | `sudo systemctl restart aurigraph-v11` |
| 502 Bad Gateway | Backend not responding | Check logs, restart service |
| Out of memory | JAR too large for allocated RAM | Increase -Xmx in systemd config |
| Port 9003 in use | Another process using port | Kill conflicting process |
| Disk full | /opt/aurigraph/v11 full | Clean up old logs/files |
| Database error | PostgreSQL down | `sudo systemctl restart postgresql` |
| Permission denied | Service can't read JAR | Check file ownership: `sudo chown subbu /opt/aurigraph/v11/*` |
| Timeout on health check | Service taking too long to start | Wait 30+ seconds, check logs |

---

## 🎯 REAL-TIME MONITORING

While debugging, open a second terminal and monitor logs:

```bash
# Terminal 1: Monitor logs in real-time
ssh -p 2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11 -f'

# Terminal 2: Run fixes and checks
ssh -p 2235 subbu@dlt.aurigraph.io
```

---

## 📞 IF STILL BROKEN

If none of these fixes work:

1. **Collect diagnostic data:**
   ```bash
   ssh -p 2235 subbu@dlt.aurigraph.io <<'EOF'
   echo "=== System Info ===" > /tmp/debug.txt
   uname -a >> /tmp/debug.txt
   echo "" >> /tmp/debug.txt

   echo "=== Java Version ===" >> /tmp/debug.txt
   java -version 2>&1 >> /tmp/debug.txt
   echo "" >> /tmp/debug.txt

   echo "=== Disk Space ===" >> /tmp/debug.txt
   df -h >> /tmp/debug.txt
   echo "" >> /tmp/debug.txt

   echo "=== Memory ===" >> /tmp/debug.txt
   free -h >> /tmp/debug.txt
   echo "" >> /tmp/debug.txt

   echo "=== Service Status ===" >> /tmp/debug.txt
   sudo systemctl status aurigraph-v11 >> /tmp/debug.txt
   echo "" >> /tmp/debug.txt

   echo "=== Recent Logs ===" >> /tmp/debug.txt
   sudo journalctl -u aurigraph-v11 -n 100 >> /tmp/debug.txt

   cat /tmp/debug.txt
   EOF
   ```

2. **Re-deploy from scratch:**
   ```bash
   # If service is truly broken, re-deploy:
   cd aurigraph-v11-standalone
   ./deploy-sprint16-production.sh
   ```

3. **Contact:**
   - Check error logs thoroughly
   - Document exact error messages
   - Verify all prerequisites met
   - Consider rolling back to previous version

---

## ⚠️ PREVENTION

To avoid future 502 errors:

1. **Monitor service regularly:**
   ```bash
   # Add to cron job
   */5 * * * * curl -f http://localhost:9003/q/health > /dev/null || \
     (echo "Service down" | mail -s "Aurigraph Down" admin@example.com)
   ```

2. **Auto-restart on failure:**
   - Systemd already has `Restart=always` configured
   - Service will auto-restart on crash

3. **Monitor disk space:**
   ```bash
   # Alert if disk >80%
   df -h /opt/aurigraph/v11 | awk 'NR==2 {print $5}' | \
     grep -o '^[0-9]*' | awk '{if ($1 > 80) print "Disk almost full!"}'
   ```

4. **Monitor logs for errors:**
   ```bash
   # Alert on ERROR in logs
   sudo journalctl -u aurigraph-v11 --since "1 hour ago" | \
     grep ERROR && echo "Errors detected!"
   ```

---

**Status:** 🚨 EMERGENCY FIX GUIDE
**Created:** November 4, 2025
**Priority:** HIGH - Use immediately if experiencing 502 errors

Execute the fixes above in order. The service should come back online within 5-15 minutes.
