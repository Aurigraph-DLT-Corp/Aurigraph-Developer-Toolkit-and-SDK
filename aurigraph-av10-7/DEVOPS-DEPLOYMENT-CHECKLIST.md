# Aurigraph V11 - DevOps Deployment Checklist

**Purpose**: Prevent deployment incidents like the October 31 login outage
**Updated**: October 31, 2025
**For**: DevOps Team & Deployment Agents

---

## Pre-Deployment Validation

### ✅ Check Prerequisites

- [ ] **Docker** is installed: `docker --version`
- [ ] **Docker Compose** is installed: `docker-compose --version`
- [ ] **Java** 21+ is available: `java --version`
- [ ] **NGINX** is properly configured: `nginx -t`
- [ ] **SSL certificates** exist: `ls /etc/letsencrypt/live/aurcrt/`
- [ ] **Disk space** available: `df -h /opt/DLT` (min 50GB)
- [ ] **Memory** available: `free -h` (min 8GB)

### ✅ Cleanup Old Deployments

```bash
# CRITICAL: Kill any existing Aurigraph processes
pkill -f "java.*aurigraph" || true
sleep 2

# Verify nothing is holding port 9003
netstat -tuln | grep 9003
# Should return empty - if not, manually kill:
# lsof -i :9003  # then kill -9 <PID>

# Verify nothing is holding ports 80/443
netstat -tuln | grep -E ":(80|443)"
# Should return empty or only NGINX systemd service
```

### ✅ Backup Current State

```bash
# Before any deployment, backup everything
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r /opt/DLT /opt/DLT.backup_${TIMESTAMP}
echo "✅ Backed up to /opt/DLT.backup_${TIMESTAMP}"
```

### ✅ Validate Configuration

```bash
# Test NGINX config
sudo nginx -t
# Should show: "configuration file /etc/nginx/nginx.conf syntax is ok"

# Verify docker-compose.yml is valid
docker-compose -f /opt/DLT/docker-compose.yml config > /dev/null
# Should complete without errors
```

---

## Deployment Steps

### Step 1: Clean Up Old Containers & Volumes

```bash
cd /opt/DLT

# Stop and remove all containers
docker-compose down

# ⚠️ ONLY if you're replacing everything:
# docker system prune -f --volumes
```

### Step 2: Pull Latest Images

```bash
docker-compose pull
# Pull latest versions of all images (openjdk:21-slim, nginx, postgres, etc.)
```

### Step 3: Verify docker-compose.yml Configuration

```bash
# ✅ CRITICAL: Ensure these sections exist:

# Database service (if backend requires it)
cat docker-compose.yml | grep -A 10 "postgres:"

# Backend service with proper configuration
cat docker-compose.yml | grep -A 15 "backend:"

# Health checks on all services
cat docker-compose.yml | grep -A 5 "healthcheck:"

# Proper depends_on with conditions
cat docker-compose.yml | grep "depends_on:" -A 5
```

### Step 4: Start Services in Proper Order

```bash
# Start all services (Docker Compose handles ordering)
docker-compose up -d

# Watch logs while starting (don't proceed until all services healthy)
docker-compose logs -f

# Wait for all health checks to pass (check status column)
docker-compose ps
# Expected output: all services show "Up (healthy)" or "Up"
```

### Step 5: Verify Each Service

#### Backend Health Check
```bash
# Wait up to 60 seconds for backend to be ready
for i in {1..60}; do
    if curl -sf http://localhost:9003/api/v11/health > /dev/null; then
        echo "✅ Backend is HEALTHY"
        curl -s http://localhost:9003/api/v11/health | jq .
        break
    fi
    echo "⏳ Waiting for backend... ($i/60)"
    sleep 1
done

# If this fails, debug with:
# docker-compose logs backend | tail -100
```

#### Frontend Health Check
```bash
# Verify frontend is being served
curl -sf https://dlt.aurigraph.io/index.html > /dev/null
echo "✅ Frontend is accessible"

# Verify SSL certificate is valid
curl -vI https://dlt.aurigraph.io 2>&1 | grep "SSL certificate"
```

#### Database Health Check (if using PostgreSQL)
```bash
# Test database connectivity
docker-compose exec postgres pg_isready -U aurigraph
# Expected: "accepting connections"

# If failed, check logs:
# docker-compose logs postgres
```

#### NGINX Health Check
```bash
# Verify NGINX syntax
sudo nginx -t

# Test proxy to backend
curl -sf https://dlt.aurigraph.io/api/v11/health | jq .
# Should return JSON health response, not 502 or 301
```

### Step 6: Validate Login Functionality

```bash
# Test login endpoint
curl -X POST https://dlt.aurigraph.io/api/v11/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -s | jq .

# Expected: Should return authentication token (not 502 or 301)
```

---

## Post-Deployment Verification

### ✅ Health Monitoring

```bash
# Script to verify all services are healthy
cat > /tmp/check_health.sh << 'EOF'
#!/bin/bash
echo "🔍 Aurigraph Health Check"
echo "=========================="

# Check Docker containers
echo "📦 Docker Status:"
docker-compose -f /opt/DLT/docker-compose.yml ps

# Check backend API
echo -e "\n🔌 Backend API:"
curl -s https://dlt.aurigraph.io/api/v11/health | jq . || echo "❌ Backend not responding"

# Check frontend
echo -e "\n🎨 Frontend:"
curl -sf https://dlt.aurigraph.io > /dev/null && echo "✅ Frontend serving" || echo "❌ Frontend not responding"

# Check NGINX
echo -e "\n🔀 NGINX:"
sudo systemctl is-active nginx > /dev/null && echo "✅ NGINX running" || echo "❌ NGINX not running"

# Check ports
echo -e "\n🔌 Ports:"
netstat -tuln | grep -E ":(80|443|9003)" || echo "⚠️ Key ports not listening"

# Check disk space
echo -e "\n💾 Disk Space:"
df -h /opt/DLT | tail -1

echo -e "\n✅ Health check complete!"
EOF

chmod +x /tmp/check_health.sh
/tmp/check_health.sh
```

### ✅ Monitor Logs for Errors

```bash
# Watch backend logs
docker-compose logs -f backend --tail=50

# Watch NGINX access logs
sudo tail -f /var/log/nginx/access.log

# Watch NGINX error logs
sudo tail -f /var/log/nginx/error.log

# Watch systemd logs
sudo journalctl -u nginx -f
```

### ✅ Test Common Operations

```bash
# 1. Test login
curl -X POST https://dlt.aurigraph.io/api/v11/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# 2. Test dashboard access
curl -sf https://dlt.aurigraph.io/

# 3. Test WebSocket endpoints (if applicable)
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://dlt.aurigraph.io/ws/metrics

# 4. Test API rate limiting (should not be rate limited)
for i in {1..10}; do
    curl -s https://dlt.aurigraph.io/api/v11/health | jq -r .status
done
```

---

## Troubleshooting Runbook

### Problem: 502 Bad Gateway

**Diagnosis**:
```bash
# Check if backend is running
docker-compose ps | grep backend
# Should show "Up" status

# Check if backend is responding
curl -s http://localhost:9003/api/v11/health | jq .

# Check NGINX logs
sudo tail -f /var/log/nginx/error.log
```

**Solutions**:
1. Check docker-compose logs: `docker-compose logs backend`
2. Check if port 9003 is in use: `netstat -tuln | grep 9003`
3. Restart backend: `docker-compose restart backend`
4. Check if database is healthy: `docker-compose ps postgres`

### Problem: 301 Redirects on All Requests

**Diagnosis**:
```bash
# This usually means NGINX can't connect to backend
curl -v https://dlt.aurigraph.io/
# Look for "301 Moved Permanently"

# Check NGINX error logs
sudo tail -50 /var/log/nginx/error.log | grep "upstream"
```

**Solutions**:
1. **Port conflict**: `pkill -f "java.*aurigraph"` (kill old processes)
2. **Wrong proxy config**: Verify `proxy_pass` uses `localhost:9003` not `backend:9003`
3. **Backend crashed**: Check `docker-compose logs backend`
4. **Missing service dependency**: Add database to docker-compose

### Problem: Backend Won't Start (Exit Code 128)

**Diagnosis**:
```bash
docker-compose logs backend | tail -100
# Look for "Connection refused" or "PersistenceException"
```

**Solutions**:
1. **Missing PostgreSQL**: Add postgres service to docker-compose.yml
2. **Database not ready**: Add `depends_on` with health check condition
3. **Wrong database URL**: Verify `QUARKUS_DATASOURCE_JDBC_URL` is correct
4. **Build-time config override**: This requires JAR rebuild

### Problem: Port Already in Use

**Diagnosis**:
```bash
# Find what's using the port
sudo lsof -i :9003      # Backend port
sudo lsof -i :80        # HTTP port
sudo lsof -i :443       # HTTPS port
sudo lsof -i :5432      # PostgreSQL port
```

**Solutions**:
```bash
# Kill old process
kill -9 <PID>

# Or change docker-compose.yml port mapping
# Change: ports: ["9003:9003"]
# To: ports: ["9004:9003"]  # Use different external port
```

### Problem: SSL Certificate Errors

**Diagnosis**:
```bash
# Check certificate validity
ls -la /etc/letsencrypt/live/aurcrt/

# Test SSL
curl -vI https://dlt.aurigraph.io 2>&1 | grep -A 5 "SSL"
```

**Solutions**:
1. **Expired certificate**: `sudo certbot renew`
2. **Wrong path in NGINX config**: Verify `/etc/nginx/certs/fullchain.pem` exists
3. **Cert file permissions**: `sudo chmod 644 /etc/letsencrypt/live/aurcrt/*`

---

## Rollback Procedure

If deployment fails and you need to revert:

```bash
# 1. Stop current deployment
docker-compose down

# 2. Remove failed volumes (if needed)
docker volume rm dlt_data

# 3. Restore from backup
LATEST_BACKUP=$(ls -t /opt/DLT.backup_* | head -1)
rm -rf /opt/DLT
cp -r $LATEST_BACKUP /opt/DLT

# 4. Restart previous version
cd /opt/DLT
docker-compose up -d

# 5. Verify health
curl -s https://dlt.aurigraph.io/api/v11/health | jq .

echo "✅ Rollback complete!"
```

---

## Maintenance Tasks

### Daily
- [ ] Check `docker-compose ps` - all services healthy?
- [ ] Monitor logs for errors
- [ ] Verify API responds with `curl https://dlt.aurigraph.io/api/v11/health`

### Weekly
- [ ] Review disk usage: `df -h /opt/DLT`
- [ ] Check Docker image sizes: `docker images`
- [ ] Review error logs: `sudo tail -100 /var/log/nginx/error.log`
- [ ] Test login functionality
- [ ] Run health check script

### Monthly
- [ ] Review and rotate logs
- [ ] Update Docker images: `docker-compose pull && docker-compose up -d`
- [ ] Check SSL certificate expiration: `certbot certificates`
- [ ] Verify backups: `ls -lh /opt/DLT.backup_*`
- [ ] Stress test with load tool

### Quarterly
- [ ] Disaster recovery drill (test restore from backup)
- [ ] Review deployment logs and incidents
- [ ] Update documentation
- [ ] Performance optimization review

---

## Critical Commands Reference

| Task | Command |
|------|---------|
| **Start all services** | `docker-compose up -d` |
| **Stop all services** | `docker-compose down` |
| **View status** | `docker-compose ps` |
| **View logs** | `docker-compose logs -f <service>` |
| **Restart service** | `docker-compose restart <service>` |
| **Rebuild image** | `docker-compose build --no-cache <service>` |
| **Clean Docker** | `docker system prune -f --volumes` |
| **Check health** | `curl https://dlt.aurigraph.io/api/v11/health` |
| **Reload NGINX** | `sudo systemctl reload nginx` |
| **Test NGINX config** | `sudo nginx -t` |
| **Kill old processes** | `pkill -f "java.*aurigraph"` |
| **Check port usage** | `netstat -tuln \| grep <port>` |
| **View Docker logs** | `docker logs <container>` |
| **SSH to server** | `ssh subbu@dlt.aurigraph.io` |
| **Backup deployment** | `cp -r /opt/DLT /opt/DLT.backup_$(date +%s)` |

---

## Escalation Procedure

If deployment fails:

**Level 1 - Immediate Actions** (5 minutes)
1. Check docker-compose logs
2. Verify NGINX error logs
3. Check port availability
4. Verify database connectivity

**Level 2 - Troubleshooting** (15 minutes)
1. Review incident report
2. Check recent git changes
3. Compare with last working backup
4. Test individual services

**Level 3 - Rollback** (5 minutes)
1. Stop current deployment
2. Restore from latest backup
3. Verify health
4. Document incident

**Level 4 - Escalate** (If still failing)
1. Contact senior DevOps engineer
2. Schedule war room
3. Review deployment architecture
4. Plan proper fix

---

## Success Indicators

✅ **Deployment is successful when**:

- All Docker containers show "Up" or "Up (healthy)"
- `curl https://dlt.aurigraph.io/api/v11/health` returns 200 with JSON
- Frontend loads at `https://dlt.aurigraph.io`
- Login works with admin/admin credentials
- NGINX error log has no "upstream" connection errors
- No processes listening on port 9003 outside Docker
- Disk usage is reasonable (<80% of /opt/DLT)
- All services have passed health checks

❌ **Deployment has failed if**:

- Any container shows "Exit" or "Exited" status
- Backend returns 502 or 301 instead of API response
- NGINX error log shows "upstream" connection refused
- Port conflicts prevent services from starting
- SSL certificate issues prevent HTTPS access
- Login returns authentication error
- Dashboard doesn't load after login

---

**Last Updated**: October 31, 2025
**Created By**: AI Development & DevOps Team
**Version**: 1.0

---

## Quick Links

- **Deployment Report**: [DEPLOYMENT-INCIDENT-REPORT.md](./DEPLOYMENT-INCIDENT-REPORT.md)
- **Docker Compose**: `/opt/DLT/docker-compose.yml`
- **NGINX Config**: `/opt/DLT/nginx/default.conf`
- **Server**: `ssh subbu@dlt.aurigraph.io`
- **Portal**: `https://dlt.aurigraph.io`
- **Health Check**: `https://dlt.aurigraph.io/api/v11/health`
