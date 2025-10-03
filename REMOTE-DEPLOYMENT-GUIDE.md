# Aurigraph V11 Remote Deployment Guide

**Date**: October 3, 2025
**Target Server**: dlt.aurigraph.io
**Current Status**: ⚠️ Build and SSH issues detected

---

## 🚨 Current Issues Blocking Automated Deployment

### Issue 1: SSH Connection Failure
**Problem**: SSH connection to dlt.aurigraph.io:2235 is being closed immediately

**Error**:
```
Connection closed by 151.242.51.55 port 2235
```

**Attempted Solutions**:
- ✅ SSH key authentication (configured in ~/.ssh/config)
- ✅ Password authentication with sshpass
- ❌ Both methods failing

**Possible Causes**:
1. SSH keys not added to server's `~/.ssh/authorized_keys`
2. Server SSH configuration rejecting connections
3. IP address restrictions on server firewall
4. User account restrictions

### Issue 2: Build Failures
**Problem**: Local build failing with missing dependencies

**Errors**:
```
[ERROR] Unsatisfied dependency for type io.aurigraph.v11.performance.MetricsCollector
[ERROR] Unsatisfied dependency for type jakarta.persistence.EntityManager
```

**Status**: Code needs fixes before building locally

---

## ✅ Known Working Deployment (September 29, 2025)

### Deployed Configuration
- **Version**: 11.0.0
- **Location**: `/home/subbu/aurigraph-v11-deployment/`
- **Port**: 9003
- **Status**: ✅ Running and operational
- **JAR Size**: 1.5GB (uber JAR)

### Verified Endpoints
| Endpoint | Status |
|----------|--------|
| http://dlt.aurigraph.io:9003/q/health | ✅ Working |
| http://dlt.aurigraph.io:9003/api/v11/info | ✅ Working |
| http://dlt.aurigraph.io:9003/q/metrics | ✅ Working |

---

## 🔧 Fix SSH Connection (Required First)

### Option 1: Add SSH Key to Server (Recommended)

**Step 1**: Copy your public key
```bash
cat ~/.ssh/id_rsa.pub
```

**Step 2**: Manually login to server using password:
1. Open a terminal
2. Run: `ssh -p 2235 subbu@dlt.aurigraph.io`
3. Enter password: `subbuFuture@2025`

**Step 3**: Add key to authorized_keys
```bash
# On the server
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Step 4**: Test SSH key authentication
```bash
# From your local machine
ssh -p 2235 subbu@dlt.aurigraph.io "echo 'SSH key working!'"
```

### Option 2: Check Server SSH Configuration

**On the server**, verify SSH is configured correctly:
```bash
sudo nano /etc/ssh/sshd_config

# Check these settings:
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication yes
ChallengeResponseAuthentication no

# Restart SSH
sudo systemctl restart ssh
```

### Option 3: Check Firewall Rules

```bash
# On the server
sudo ufw status
sudo ufw allow 2235/tcp

# Check if your IP is blocked
sudo fail2ban-client status sshd
```

---

## 📦 Manual Deployment Process (When SSH Works)

### Step 1: Fix Build Issues

Before deploying, fix the missing dependencies:

**Add MetricsCollector**:
```java
// File: src/main/java/io/aurigraph/v11/performance/MetricsCollector.java
package io.aurigraph.v11.performance;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class MetricsCollector {
    private AtomicLong transactionCount = new AtomicLong(0);
    private AtomicLong requestCount = new AtomicLong(0);

    public void recordTransaction() {
        transactionCount.incrementAndGet();
    }

    public void recordRequest() {
        requestCount.incrementAndGet();
    }

    public long getTransactionCount() {
        return transactionCount.get();
    }

    public long getRequestCount() {
        return requestCount.get();
    }
}
```

**Add JPA persistence configuration**:
```properties
# File: src/main/resources/application.properties
# Add these lines:

quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph
quarkus.datasource.password=aurigraph123
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph

quarkus.hibernate-orm.database.generation=update
```

### Step 2: Build Locally

```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Clean build
./mvnw clean package -Dmaven.test.skip=true -Dquarkus.package.jar.type=uber-jar

# Verify build
ls -lh target/*-runner.jar
```

### Step 3: Create Deployment Package

```bash
# Create deployment directory
mkdir -p ~/aurigraph-deployment-package

# Copy artifacts
cp target/aurigraph-v11-standalone-11.0.0-runner.jar ~/aurigraph-deployment-package/
cp src/main/resources/application.properties ~/aurigraph-deployment-package/
cp -r scripts ~/aurigraph-deployment-package/ 2>/dev/null || true

# Create deployment scripts
cat > ~/aurigraph-deployment-package/start-aurigraph-v11.sh << 'EOF'
#!/bin/bash
java -Xmx1g -Xms512m -XX:+UseG1GC \
  -Dquarkus.http.port=9003 \
  -Dquarkus.profile=production \
  -jar aurigraph-v11-standalone-11.0.0-runner.jar > aurigraph-v11.log 2>&1 &

echo $! > aurigraph-v11.pid
echo "Aurigraph V11 started with PID: $(cat aurigraph-v11.pid)"
EOF

cat > ~/aurigraph-deployment-package/stop-aurigraph-v11.sh << 'EOF'
#!/bin/bash
if [ -f aurigraph-v11.pid ]; then
  PID=$(cat aurigraph-v11.pid)
  kill $PID
  echo "Stopped Aurigraph V11 (PID: $PID)"
  rm aurigraph-v11.pid
else
  echo "No PID file found"
fi
EOF

chmod +x ~/aurigraph-deployment-package/*.sh

# Create tarball
cd ~/aurigraph-deployment-package
tar -czf ~/aurigraph-v11-deployment-$(date +%Y%m%d).tar.gz .
echo "Deployment package created: ~/aurigraph-v11-deployment-$(date +%Y%m%d).tar.gz"
```

### Step 4: Upload to Server

```bash
# Upload deployment package
scp -P 2235 ~/aurigraph-v11-deployment-$(date +%Y%m%d).tar.gz \
  subbu@dlt.aurigraph.io:/home/subbu/

# SSH to server
ssh -p 2235 subbu@dlt.aurigraph.io
```

### Step 5: Deploy on Server

```bash
# On the server
cd /home/subbu

# Backup current deployment
sudo systemctl stop aurigraph-v11 2>/dev/null || true
pkill -f aurigraph-v11-standalone || true
mv aurigraph-v11-deployment aurigraph-v11-deployment-backup-$(date +%Y%m%d) 2>/dev/null || true

# Extract new deployment
mkdir -p aurigraph-v11-deployment
cd aurigraph-v11-deployment
tar -xzf ../aurigraph-v11-deployment-*.tar.gz

# Start service
./start-aurigraph-v11.sh

# Verify service
sleep 5
curl http://localhost:9003/q/health
curl http://localhost:9003/api/v11/info
```

### Step 6: Verify Deployment

```bash
# Check process
ps aux | grep aurigraph-v11

# Check logs
tail -f aurigraph-v11.log

# Test endpoints
curl http://dlt.aurigraph.io:9003/q/health
curl http://dlt.aurigraph.io:9003/api/v11/info
curl http://dlt.aurigraph.io:9003/q/metrics
```

---

## 🤖 Automated Deployment Script (When SSH Fixed)

I've created an automated deployment script at:
```
/Users/subbujois/Documents/GitHub/Aurigraph-DLT/deploy-to-remote-server.sh
```

**Usage** (after SSH is fixed):
```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT
./deploy-to-remote-server.sh
```

**What it does**:
1. ✅ Builds application locally
2. ✅ Creates deployment package
3. ✅ Uploads to server
4. ✅ Stops old service
5. ✅ Deploys new version
6. ✅ Starts service
7. ✅ Verifies deployment

---

## 📋 Quick Checklist

### Before Deployment
- [ ] SSH connection working (`ssh -p 2235 subbu@dlt.aurigraph.io`)
- [ ] Build dependencies fixed
- [ ] Local build successful
- [ ] Deployment package created
- [ ] Backup of current deployment taken

### During Deployment
- [ ] Old service stopped gracefully
- [ ] Files uploaded successfully
- [ ] Permissions set correctly
- [ ] New service started
- [ ] Logs show no errors

### After Deployment
- [ ] Health endpoint responding
- [ ] API endpoints working
- [ ] Metrics available
- [ ] Performance acceptable
- [ ] Old backup can be removed

---

## 🆘 Troubleshooting

### SSH Still Not Working?

**Try from a different network**:
- Your IP might be blocked
- Try from a VPN or different location

**Check server logs**:
```bash
# On server
sudo tail -f /var/log/auth.log | grep sshd
```

**Verify SSH service**:
```bash
# On server
sudo systemctl status ssh
sudo netstat -tlnp | grep 2235
```

### Build Still Failing?

**Option 1**: Deploy existing working version
- The September 29 deployment is working
- No need to redeploy if it's stable

**Option 2**: Build on server directly
```bash
# SSH to server
cd /home/subbu
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -Dmaven.test.skip=true
```

### Service Won't Start?

**Check Java version**:
```bash
java --version  # Must be Java 21+
```

**Check port availability**:
```bash
sudo netstat -tlnp | grep 9003
sudo lsof -i :9003
```

**Check logs**:
```bash
tail -f /home/subbu/aurigraph-v11-deployment/aurigraph-v11.log
```

---

## 📞 Next Steps

1. **Fix SSH Connection** ✅ Critical
   - Add SSH key to server OR
   - Fix server SSH configuration OR
   - Contact server admin

2. **Fix Build Issues** (if needed)
   - Add missing MetricsCollector class
   - Configure JPA/database
   - Test build locally

3. **Deploy**
   - Use automated script OR
   - Follow manual steps above

4. **Verify**
   - Test all endpoints
   - Check performance
   - Monitor logs

---

## 📊 Current Deployment Info

**Server**: dlt.aurigraph.io (151.242.51.55)
**SSH Port**: 2235
**User**: subbu
**Deployment Dir**: /home/subbu/aurigraph-v11-deployment/
**Service Port**: 9003
**Current Version**: 11.0.0 (deployed Sept 29, 2025)
**Status**: ✅ Running

**Health Check**: http://dlt.aurigraph.io:9003/q/health

---

**Priority**: Fix SSH connection first, then we can automate everything else!

---

*Generated: October 3, 2025*
*Status: SSH connection needed for automated deployment*
