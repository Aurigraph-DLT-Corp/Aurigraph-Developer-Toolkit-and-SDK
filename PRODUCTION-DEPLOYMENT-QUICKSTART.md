# Aurigraph V11 Enterprise Portal - Production Deployment Quick Start

**Version**: 1.0
**Date**: October 4, 2025
**Estimated Time**: 30-60 minutes

---

## TL;DR - One-Command Deployment

```bash
# From your local machine
chmod +x deploy-to-production.sh
./deploy-to-production.sh
```

That's it! The script will handle everything automatically.

---

## Prerequisites (5 minutes)

### Required Access
- [x] SSH access to `dlt.aurigraph.io` (port 2235)
- [x] Credentials: `subbu@dlt.aurigraph.io` (password in Credentials.md)
- [x] Sudo privileges on production server

### Required Tools (on local machine)
```bash
# Verify required commands
command -v ssh && echo "✅ SSH installed" || echo "❌ Install SSH"
command -v scp && echo "✅ SCP installed" || echo "❌ Install SCP"
command -v curl && echo "✅ cURL installed" || echo "❌ Install cURL"
```

### Verify Portal File
```bash
# Check portal file exists
ls -lh aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html

# Should show: 4,741 lines
wc -l aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html
```

---

## Automated Deployment (30 minutes)

### Step 1: Run Deployment Script

```bash
# Navigate to project directory
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Make script executable (first time only)
chmod +x deploy-to-production.sh

# Run deployment
./deploy-to-production.sh
```

### What the Script Does

1. **Pre-flight Checks** (2 min)
   - ✅ Verifies portal file exists
   - ✅ Tests SSH connectivity
   - ✅ Checks server resources (disk, memory)
   - ✅ Verifies Nginx and V11 backend status

2. **Backup Current State** (3 min)
   - ✅ Backs up existing portal (if any)
   - ✅ Backs up Nginx configuration
   - ✅ Creates restore point

3. **Deploy Portal** (10 min)
   - ✅ Creates directory structure
   - ✅ Transfers portal file to green environment
   - ✅ Verifies file integrity

4. **Configure Nginx** (5 min)
   - ✅ Creates production Nginx config
   - ✅ Enables SSL/TLS (HTTPS)
   - ✅ Configures API proxy
   - ✅ Tests configuration

5. **Activate Deployment** (2 min)
   - ✅ Reloads Nginx (zero-downtime)
   - ✅ Switches traffic to new deployment

6. **Validation** (8 min)
   - ✅ Health checks (Nginx, API, portal)
   - ✅ External access tests (HTTP, HTTPS, API)
   - ✅ Resource monitoring

### Expected Output

```
=================================================
Aurigraph V11 Enterprise Portal - Production Deployment
=================================================

Target Server: dlt.aurigraph.io:2235
Deployment Environment: green
Local Portal File: /Users/.../aurigraph-v11-enterprise-portal.html

Continue with deployment? (yes/no): yes

=================================================
Checking Prerequisites
=================================================
✅ Portal file found (4741 lines)
✅ SSH connection successful
✅ All required commands available

=================================================
Pre-Deployment Checks on Remote Server
=================================================
✅ Disk space: 45% used
✅ Free memory: 68%
✅ Nginx is running
✅ V11 Backend is healthy
✅ Pre-deployment checks passed

=================================================
Creating Backup
=================================================
✅ Portal backup created: backup-20251004_120530.tar.gz
✅ Nginx config backed up
✅ Backup completed

=================================================
Deploying Portal to green Environment
=================================================
ℹ️  Creating deployment directories...
ℹ️  Transferring portal file to green environment...
✅ Portal file transferred successfully
ℹ️  Verifying deployment...
✅ File integrity verified (4741 lines)

=================================================
Configuring Nginx
=================================================
Testing Nginx configuration...
✅ Nginx configuration is valid
✅ Nginx configured successfully

=================================================
Reloading Nginx (Zero-Downtime)
=================================================
Reloading Nginx...
✅ Nginx reloaded successfully

=================================================
Post-Deployment Validation
=================================================
ℹ️  Waiting 5 seconds for services to stabilize...
Running health checks...
✅ Nginx is running
✅ V11 Backend is healthy
✅ Portal file exists (4741 lines)
✅ Disk usage: 45%
✅ Memory: 12Gi used of 49Gi

ℹ️  Testing external access...
✅ HTTP redirect working (HTTP 301)
✅ HTTPS portal accessible (HTTP 200)
✅ API endpoint accessible (HTTP 200)

=================================================
Deployment Summary
=================================================
🎉 Deployment completed successfully!

Portal Details:
  - Environment: green
  - Portal URL: https://dlt.aurigraph.io/portal/
  - API Base URL: https://dlt.aurigraph.io/api/v11/
  - Health Check: https://dlt.aurigraph.io/health

Next Steps:
  1. Open https://dlt.aurigraph.io/portal/ in browser
  2. Test all 23 navigation tabs
  3. Verify API integration
  4. Monitor logs
  5. Check metrics

✅ Production deployment complete! 🚀
```

---

## Manual Deployment (Alternative)

If you prefer manual control, follow these steps:

### Step 1: SSH into Server
```bash
ssh -p2235 subbu@dlt.aurigraph.io
```

### Step 2: Create Directory Structure
```bash
sudo mkdir -p /opt/aurigraph/portal/{blue,green,static,scripts}
sudo mkdir -p /opt/aurigraph/logs/{nginx,portal,backend}
sudo mkdir -p /opt/aurigraph/backups/{portal,database,config}
sudo chown -R subbu:subbu /opt/aurigraph/
```

### Step 3: Transfer Portal File
```bash
# From local machine (new terminal)
scp -P 2235 \
    aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html \
    subbu@dlt.aurigraph.io:/opt/aurigraph/portal/green/
```

### Step 4: Configure Nginx
```bash
# On production server
sudo tee /etc/nginx/sites-available/aurigraph-portal.conf > /dev/null << 'EOF'
# Nginx configuration here (see deploy-to-production.sh for full config)
upstream portal_backend {
    server localhost:9003;
    keepalive 32;
}

server {
    listen 80;
    server_name dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;

    root /opt/aurigraph/portal/green;
    index aurigraph-v11-enterprise-portal.html;

    location /portal {
        alias /opt/aurigraph/portal/green;
        try_files $uri $uri/ /aurigraph-v11-enterprise-portal.html;
    }

    location /api/v11 {
        proxy_pass http://portal_backend;
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/aurigraph-portal.conf \
            /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### Step 5: Verify Deployment
```bash
# Check portal
curl -I https://dlt.aurigraph.io/portal/

# Check API
curl https://dlt.aurigraph.io/api/v11/health
```

---

## Post-Deployment Testing (10 minutes)

### Browser Testing Checklist

1. **Open Portal**: https://dlt.aurigraph.io/portal/
   - [ ] Portal loads in < 2 seconds
   - [ ] No console errors (F12 Developer Tools)
   - [ ] HTTPS lock icon visible in browser

2. **Test Navigation** (all 23 tabs):
   - [ ] Dashboard
   - [ ] Platform Status
   - [ ] Transactions
   - [ ] Performance
   - [ ] Transaction Analytics
   - [ ] Validator Analytics
   - [ ] Consensus
   - [ ] Quantum Crypto
   - [ ] Cross-Chain Bridge
   - [ ] HMS Integration
   - [ ] AI Optimization
   - [ ] Network Config
   - [ ] System Settings
   - [ ] Validator Mgmt
   - [ ] Consensus Monitor
   - [ ] Node Management
   - [ ] Staking
   - [ ] Governance
   - [ ] Data Export
   - [ ] HMS Provider
   - [ ] Load Testing
   - [ ] Alert Config
   - [ ] System Integration

3. **Test Features**:
   - [ ] Charts render correctly
   - [ ] Tables display data
   - [ ] Forms accept input
   - [ ] API calls return data

4. **Cross-Browser Testing**:
   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest)
   - [ ] Mobile browser

### API Testing Checklist

```bash
# Health check
curl https://dlt.aurigraph.io/api/v11/health

# Platform info
curl https://dlt.aurigraph.io/api/v11/info

# Performance stats
curl https://dlt.aurigraph.io/api/v11/stats

# Metrics endpoint
curl https://dlt.aurigraph.io/q/metrics
```

---

## Monitoring (Continuous)

### View Logs

```bash
# SSH into server
ssh -p2235 subbu@dlt.aurigraph.io

# Portal access log (live)
tail -f /opt/aurigraph/logs/nginx/portal-access.log

# Portal error log (live)
tail -f /opt/aurigraph/logs/nginx/portal-error.log

# V11 backend logs
tail -f /opt/aurigraph/logs/backend/v11-backend.log
```

### Monitor Metrics

- **Portal Metrics**: https://dlt.aurigraph.io/q/metrics
- **Health Check**: https://dlt.aurigraph.io/health
- **Dev UI** (if enabled): https://dlt.aurigraph.io/q/dev/

### System Resources

```bash
# CPU, Memory, Disk
ssh -p2235 subbu@dlt.aurigraph.io "top -bn1 | head -20"

# Disk space
ssh -p2235 subbu@dlt.aurigraph.io "df -h /opt"

# Memory usage
ssh -p2235 subbu@dlt.aurigraph.io "free -h"

# Active connections
ssh -p2235 subbu@dlt.aurigraph.io "netstat -an | grep :443 | wc -l"
```

---

## Rollback (If Needed)

### Automated Rollback

If deployment fails, the script offers automatic rollback:

```bash
# During deployment, if error occurs:
Rollback to previous version? (yes/no): yes
```

### Manual Rollback

```bash
# SSH into server
ssh -p2235 subbu@dlt.aurigraph.io

# Switch Nginx to blue environment
sudo sed -i 's|/opt/aurigraph/portal/green|/opt/aurigraph/portal/blue|g' \
    /etc/nginx/sites-available/aurigraph-portal.conf

# Test and reload
sudo nginx -t && sudo systemctl reload nginx

# Verify rollback
curl -I https://dlt.aurigraph.io/portal/
```

---

## Troubleshooting

### Portal Not Accessible

**Problem**: Can't access https://dlt.aurigraph.io/portal/

**Solutions**:
```bash
# Check Nginx status
ssh -p2235 subbu@dlt.aurigraph.io "systemctl status nginx"

# Check Nginx error log
ssh -p2235 subbu@dlt.aurigraph.io "tail -50 /opt/aurigraph/logs/nginx/portal-error.log"

# Restart Nginx
ssh -p2235 subbu@dlt.aurigraph.io "sudo systemctl restart nginx"
```

### SSL Certificate Issues

**Problem**: "Your connection is not private" error

**Solutions**:
```bash
# Check certificate
ssh -p2235 subbu@dlt.aurigraph.io "sudo certbot certificates"

# Renew certificate
ssh -p2235 subbu@dlt.aurigraph.io "sudo certbot renew --force-renewal"

# Reload Nginx
ssh -p2235 subbu@dlt.aurigraph.io "sudo systemctl reload nginx"
```

### API Not Responding

**Problem**: API calls return 502 Bad Gateway

**Solutions**:
```bash
# Check V11 backend status
ssh -p2235 subbu@dlt.aurigraph.io "curl http://localhost:9003/api/v11/health"

# Check if backend is running
ssh -p2235 subbu@dlt.aurigraph.io "lsof -i :9003"

# Restart V11 backend (if needed)
ssh -p2235 subbu@dlt.aurigraph.io "cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw quarkus:dev"
```

### Portal File Missing

**Problem**: Portal shows 404 error

**Solutions**:
```bash
# Check file exists
ssh -p2235 subbu@dlt.aurigraph.io "ls -lh /opt/aurigraph/portal/green/aurigraph-v11-enterprise-portal.html"

# Re-transfer file
scp -P 2235 aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html \
    subbu@dlt.aurigraph.io:/opt/aurigraph/portal/green/

# Verify
ssh -p2235 subbu@dlt.aurigraph.io "wc -l /opt/aurigraph/portal/green/aurigraph-v11-enterprise-portal.html"
```

---

## Support Contacts

- **Email**: subbu@aurigraph.io
- **Documentation**:
  - Full Plan: `/PRODUCTION-DEPLOYMENT-PLAN.md`
  - Quick Start: `/PRODUCTION-DEPLOYMENT-QUICKSTART.md`
  - Deployment Script: `/deploy-to-production.sh`

---

## Success Criteria

✅ **Deployment is successful when:**

1. Portal accessible at https://dlt.aurigraph.io/portal/
2. All 23 navigation tabs working
3. HTTPS enabled (green lock in browser)
4. API calls returning data
5. Page load time < 2 seconds
6. No console errors in browser
7. Nginx and V11 backend running
8. Health check endpoint returns "healthy"

---

## Next Steps After Deployment

1. **Monitor for 24 hours**: Watch logs and metrics
2. **Collect feedback**: Get user feedback on performance
3. **Optimize**: Address any performance issues
4. **Plan Phase 5**: Consider additional features (if approved)

---

**Deployment Date**: October 4, 2025
**Version**: 1.0
**Status**: 🚀 **READY FOR PRODUCTION**

---

**Quick Reference**:
- Portal URL: https://dlt.aurigraph.io/portal/
- API URL: https://dlt.aurigraph.io/api/v11/
- Health Check: https://dlt.aurigraph.io/health
- SSH: `ssh -p2235 subbu@dlt.aurigraph.io`
- Deployment Script: `./deploy-to-production.sh`

---

**END OF QUICK START GUIDE**
