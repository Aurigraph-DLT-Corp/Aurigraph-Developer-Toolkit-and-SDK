# Deployment Service Protocol

**Purpose**: Standard protocol for listing all services at the start and end of every deployment session.

**Created**: November 26, 2025
**Applies To**: DevOps Agent, Deployment Agent, All Development Agents

---

## Protocol Rules (#memorize)

### 1. Session Start Protocol

At the **START** of every session or deployment:

1. **List all systemd services** on production server
2. **Check service status** (running, failed, auto-restart)
3. **Identify port usage** for critical ports (9003, 9004, 9090, etc.)
4. **Document active processes** (Java, Node.js, Docker containers)
5. **Verify NGINX status** and proxy configuration
6. **Check database connectivity** (PostgreSQL)

### 2. Session End Protocol

At the **END** of every session or deployment:

1. **Re-list all systemd services** to show changes
2. **Verify target service** is running and healthy
3. **Test critical endpoints** (health, API)
4. **Document final state** (services stopped/started, configurations changed)
5. **Create deployment summary** (what changed, issues encountered)

---

## Service Listing Commands

### Production Server: dlt.aurigraph.io

#### List All Aurigraph Services
```bash
ssh subbu@dlt.aurigraph.io 'systemctl list-units --type=service --all | grep -E "aurigraph|demo"'
```

**Expected Services**:
- `aurigraph-v12.service` - V12 Backend (port 9003)
- `aurigraph-v11.service` - V11 Backend (DEPRECATED - should be disabled)
- `aurigraph-v3.6.service` - V3.6 Backend (DEPRECATED - should be disabled)
- `aurigraph-backend.service` - Generic backend (DEPRECATED - should be disabled)
- `demo-v3.6.service` - Demo service (DEPRECATED - should be disabled)

#### Check Service Status
```bash
ssh subbu@dlt.aurigraph.io 'systemctl status aurigraph-v12.service | head -20'
```

#### List Port Usage
```bash
ssh subbu@dlt.aurigraph.io 'sudo lsof -i :9003 -i :9004 -i :9090 | grep -E "java|node"'
```

#### Check Java Processes
```bash
ssh subbu@dlt.aurigraph.io 'ps aux | grep -E "aurigraph.*\.jar" | grep -v grep'
```

#### Check NGINX Status
```bash
ssh subbu@dlt.aurigraph.io 'sudo systemctl status nginx'
```

#### Check PostgreSQL Connectivity
```bash
ssh subbu@dlt.aurigraph.io 'pg_isready -h localhost -p 5432'
```

#### Check Docker Containers
```bash
ssh subbu@dlt.aurigraph.io 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

---

## Standard Output Format

### Session Start Report

```
====================================================================================================
DEPLOYMENT SESSION START - November 26, 2025 19:30:00 IST
====================================================================================================

SERVER: dlt.aurigraph.io
USER: subbu

ACTIVE SYSTEMD SERVICES:
  ✅ aurigraph-v12.service             - RUNNING      (port 9003)
  ⏸️  aurigraph-v11.service             - DISABLED
  ⏸️  aurigraph-backend.service         - DISABLED
  ⏸️  aurigraph-v3.6.service            - DISABLED
  ⏸️  demo-v3.6.service                 - DISABLED

PORT USAGE:
  9003: java (PID 247473) - aurigraph-v12.jar
  9004: <AVAILABLE>
  9090: <AVAILABLE>

JAVA PROCESSES:
  PID 247473: aurigraph-v12.jar (Xmx8g, port 9003)

NGINX STATUS:
  ✅ RUNNING - port 80/443
  Proxy: https://dlt.aurigraph.io -> localhost:9003

POSTGRESQL:
  ✅ RUNNING - port 5432
  Database: j4c_db

DOCKER CONTAINERS:
  nginx-gateway       - Up 5 hours       0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
  enterprise-portal   - Up 5 hours

CRITICAL ENDPOINTS:
  ✅ https://dlt.aurigraph.io/           - 200 OK (Enterprise Portal)
  ❌ https://dlt.aurigraph.io/api/v11/health - 502 Bad Gateway (V12 backend failing)

ISSUES DETECTED:
  1. V12 backend is in auto-restart loop (PostgreSQL auth failure)
  2. Database credentials incorrect (j4c_user password authentication failed)

====================================================================================================
```

### Session End Report

```
====================================================================================================
DEPLOYMENT SESSION END - November 26, 2025 20:45:00 IST
====================================================================================================

SERVER: dlt.aurigraph.io
USER: subbu

CHANGES MADE:
  1. ✅ Stopped and disabled aurigraph-v11.service
  2. ✅ Stopped and disabled aurigraph-backend.service
  3. ✅ Fixed PostgreSQL credentials for j4c_user
  4. ✅ Restarted aurigraph-v12.service successfully

FINAL SERVICE STATUS:
  ✅ aurigraph-v12.service             - RUNNING      (port 9003)
  ⏸️  aurigraph-v11.service             - DISABLED
  ⏸️  aurigraph-backend.service         - DISABLED
  ⏸️  aurigraph-v3.6.service            - DISABLED
  ⏸️  demo-v3.6.service                 - DISABLED

PORT USAGE:
  9003: java (PID 250123) - aurigraph-v12.jar ✅ HEALTHY
  9004: <AVAILABLE>
  9090: <AVAILABLE>

CRITICAL ENDPOINTS:
  ✅ https://dlt.aurigraph.io/           - 200 OK (Enterprise Portal)
  ✅ https://dlt.aurigraph.io/api/v11/health - 200 OK (V12 backend)

ISSUES RESOLVED:
  ✅ V12 backend PostgreSQL auth failure fixed
  ✅ V11 service removed from production

ISSUES REMAINING:
  None

NEXT STEPS:
  1. Test all Enterprise Portal screens
  2. Monitor V12 backend logs for 24 hours
  3. Verify TPS performance (target: 776K+)

====================================================================================================
```

---

## Critical Services Reference

### V12 Backend Service

**Service File**: `/etc/systemd/system/aurigraph-v12.service`

**Key Configuration**:
- **Port**: 9003 (HTTP/2)
- **Working Directory**: `/home/subbu/aurigraph-v12-deploy`
- **JAR File**: `aurigraph-v12.jar`
- **JVM Options**: `-Xmx8g -Xms4g -XX:+UseG1GC`
- **Database**: PostgreSQL (localhost:5432/j4c_db)
- **User**: j4c_user
- **Flyway**: Disabled (`QUARKUS_FLYWAY_MIGRATE_AT_START=false`)

**Health Check**:
```bash
curl -s https://dlt.aurigraph.io/api/v11/health
```

**Expected Response**:
```json
{
  "status": "UP",
  "checks": []
}
```

### NGINX Gateway Service

**Configuration**: `/etc/nginx/conf.d/default.conf`

**Key Features**:
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **SSL**: Let's Encrypt (expires Dec 3, 2025)
- **Proxy**:
  - `/api/v11/` → `http://localhost:9003/api/v11/`
  - `/` → `/usr/share/nginx/html/` (Enterprise Portal)

**Health Check**:
```bash
curl -skI https://dlt.aurigraph.io | head -1
```

**Expected Response**:
```
HTTP/2 200
```

### PostgreSQL Database

**Connection Details**:
- **Host**: localhost
- **Port**: 5432
- **Database**: j4c_db
- **User**: j4c_user
- **Password**: j4c_password (verify with DBA)

**Health Check**:
```bash
pg_isready -h localhost -p 5432
```

**Expected Response**:
```
localhost:5432 - accepting connections
```

---

## Troubleshooting Commands

### Service Won't Start
```bash
# View detailed logs
journalctl -u aurigraph-v12.service -n 100 --no-pager

# Check service configuration
cat /etc/systemd/system/aurigraph-v12.service

# Check JAR exists
ls -lh /home/subbu/aurigraph-v12-deploy/aurigraph-v12.jar

# Check permissions
ls -la /home/subbu/aurigraph-v12-deploy/
```

### Port Already in Use
```bash
# Find process using port 9003
sudo lsof -i :9003

# Kill process
sudo kill -9 <PID>

# Or stop systemd service
sudo systemctl stop <service-name>
```

### Database Connection Failed
```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U j4c_user -d j4c_db

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo journalctl -u postgresql -n 50
```

### Service Auto-Restarting
```bash
# Check restart count
systemctl show aurigraph-v12.service | grep -E "NRestarts|RestartUsec"

# Stop auto-restart
sudo systemctl mask aurigraph-v12.service

# Re-enable after fixing issue
sudo systemctl unmask aurigraph-v12.service
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] List all running services (Session Start Report)
- [ ] Backup current JAR file
- [ ] Verify database connectivity
- [ ] Check disk space (minimum 10GB free)
- [ ] Review recent logs for errors
- [ ] Test NGINX configuration

### Deployment
- [ ] Upload new JAR to `/home/subbu/aurigraph-v12-deploy/`
- [ ] Stop V12 service
- [ ] Replace JAR file
- [ ] Start V12 service
- [ ] Monitor logs for startup errors

### Post-Deployment
- [ ] Verify service is RUNNING (not auto-restarting)
- [ ] Test health endpoint
- [ ] Test critical API endpoints
- [ ] Verify Enterprise Portal loads
- [ ] Check for errors in logs
- [ ] Create Session End Report

---

## Agent Responsibilities

### DevOps Agent (DDA)
- Execute Session Start/End Protocols for every deployment
- Monitor service health after deployments
- Maintain deployment history and reports

### Deployment Agent
- Follow Deployment Checklist for every release
- Document deployment issues and resolutions
- Update service configurations as needed

### All Development Agents
- Request deployment status before making changes
- Report service issues immediately
- Follow rollback procedures if deployment fails

---

## Maintenance Schedule

### Daily
- Check V12 service status
- Review logs for errors
- Test health endpoints

### Weekly
- Review all disabled services (confirm not needed)
- Check disk space usage
- Review PostgreSQL database size

### Monthly
- SSL certificate expiry check (Let's Encrypt auto-renewal)
- Update JAR files with latest releases
- Review and clean old deployment artifacts

---

**Document Version**: 1.0
**Last Updated**: November 26, 2025
**Maintained By**: DevOps Agent, Deployment Agent

---

*End of Deployment Service Protocol*
