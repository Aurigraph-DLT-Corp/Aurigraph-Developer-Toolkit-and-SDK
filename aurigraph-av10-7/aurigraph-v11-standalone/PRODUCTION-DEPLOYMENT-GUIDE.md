# AURIGRAPH V11 & ENTERPRISE PORTAL - PRODUCTION DEPLOYMENT GUIDE

**Date**: November 1, 2025
**Status**: Ready for Deployment
**Environment**: Production
**Domain**: dlt.aurigraph.io

---

## EXECUTIVE SUMMARY

This guide provides comprehensive instructions for deploying Aurigraph V11 (Java/Quarkus) with Enterprise Portal to production at **dlt.aurigraph.io** using Docker Compose.

**Key Features**:
- ✅ Clean deployment from scratch
- ✅ Automatic removal of all existing containers/volumes/networks
- ✅ SSL/TLS with Let's Encrypt certificates
- ✅ 6-service architecture (Backend, Database, Cache, Proxy, Monitoring)
- ✅ Enterprise Portal integration
- ✅ Complete health verification

---

## CRITICAL DEPLOYMENT PARAMETERS (MEMORIZED)

**Server Configuration**:
```
SSH User:              subbu
SSH Host:              dlt.aurigraph.io
SSH Port:              22
Domain:                dlt.aurigraph.io
HTTP Port:             80 (redirects to HTTPS)
HTTPS Port:            443
Deployment Folder:     /opt/DLT
```

**SSL Certificates** (pre-installed on server):
```
Certificate Path:      /etc/letsencrypt/live/aurcrt/fullchain.pem
Private Key Path:      /etc/letsencrypt/live/aurcrt/privkey.pem
```

**Complete SSH Command**:
```bash
ssh -p22 subbu@dlt.aurigraph.io
```

---

## QUICK START

### One-Command Deployment

```bash
cd aurigraph-v11-standalone
./CLEAN-PRODUCTION-DEPLOYMENT.sh
```

This single command will:
1. ✅ Validate all local files
2. ✅ Connect to remote server
3. ✅ Clean all existing Docker containers/volumes/networks
4. ✅ Build and transfer JAR file (176 MB)
5. ✅ Configure Docker services
6. ✅ Deploy Enterprise Portal
7. ✅ Run health checks
8. ✅ Verify all services

---

## DEPLOYMENT ARCHITECTURE

### Services (6 containers)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐        ┌──────────────────────┐       │
│  │   NGINX (Port    │        │  Quarkus Backend     │       │
│  │   80, 443)       │◄──────►│  (Port 9003, 9004)   │       │
│  │                  │        │                      │       │
│  │ • Portal         │        │ • REST API           │       │
│  │ • SSL/TLS        │        │ • gRPC               │       │
│  │ • SPA Routing    │        │ • Consensus          │       │
│  │ • Rate Limiting  │        │ • Crypto             │       │
│  └──────────────────┘        │ • AI Optimization    │       │
│           ▲                   └──────────┬───────────┘       │
│           │                              │                   │
│           │      ┌──────────────────────┴────┐              │
│           │      │                            │              │
│      ┌────┴─┐ ┌──┴─────────┐ ┌──────────────┤              │
│      │      │ │            │ │              │              │
│  ┌───┴──┐ ┌─┴─┴──┐ ┌──────┴──┴───┐ ┌──────┴──┐            │
│  │Redis │ │Postgres  │ Prometheus  │ Grafana  │            │
│  │Cache │ │Database  │  (9090)     │ (3000)   │            │
│  └──────┘ └──────────┘             └──────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Network Topology

```
┌────────────────────────────────────────────────────────┐
│                 aurigraph-network (bridge)               │
│                      172.28.0.0/16                       │
├────────────────────────────────────────────────────────┤
│                                                          │
│  NGINX                Quarkus              Postgres      │
│  172.28.0.2          172.28.0.3           172.28.0.4     │
│  Port 80             Port 9003            Port 5432      │
│  Port 443            Port 9004                           │
│       │                   │                  │           │
│       ├──────┬────────────┤                  │           │
│       │      │            │                  │           │
│       ▼      ▼            ▼                  ▼           │
│    Redis          Prometheus          Grafana           │
│    172.28.0.5     172.28.0.6           172.28.0.7       │
│    Port 6379      Port 9090            Port 3000        │
│                                                          │
└────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Request
     │
     ▼
NGINX (dlt.aurigraph.io:443)
     │
     ├─── /                    ──► Serve Portal Files (React SPA)
     │
     ├─── /api/v11/*           ──► Forward to Quarkus API
     │
     ├─── /q/health            ──► Health Check Endpoint
     │
     ├─── /q/metrics           ──► Prometheus Metrics
     │
     └─── /ws/*                ──► WebSocket to Quarkus
          │
          ▼
     Quarkus Application (9003)
          │
          ├─── PostgreSQL (transactions, metadata)
          │
          ├─── Redis (caching, sessions)
          │
          └─── Consensus Engine (blockchain logic)
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment (Local Machine)

- [ ] Java 21+ installed (`java --version`)
- [ ] Maven installed and working (`mvn --version`)
- [ ] Docker installed (`docker --version`)
- [ ] SSH access configured to `subbu@dlt.aurigraph.io`
- [ ] JAR file exists: `target/aurigraph-v11-standalone-11.4.4-runner.jar`
- [ ] Enterprise Portal built: `enterprise-portal/dist/`
- [ ] NGINX config updated: `config/nginx/nginx.conf`
- [ ] Docker Compose file available: `docker-compose-production.yml`

### Deployment Steps

1. **Build JAR** (if not already built)
   ```bash
   ./mvnw clean package -DskipTests
   ```

2. **Build Enterprise Portal** (if not already built)
   ```bash
   cd enterprise-portal
   npm run build
   ```

3. **Run Deployment Script**
   ```bash
   ./CLEAN-PRODUCTION-DEPLOYMENT.sh
   ```

4. **Verify Deployment**
   ```bash
   ssh -p22 subbu@dlt.aurigraph.io
   cd /opt/DLT
   docker-compose ps
   curl https://dlt.aurigraph.io/q/health
   ```

### Post-Deployment

- [ ] Portal loads at https://dlt.aurigraph.io
- [ ] API responds at https://dlt.aurigraph.io/api/v11/info
- [ ] Health check passes: https://dlt.aurigraph.io/q/health
- [ ] Metrics available: https://dlt.aurigraph.io/q/metrics
- [ ] Prometheus running: http://dlt.aurigraph.io:9090
- [ ] Grafana accessible: http://dlt.aurigraph.io:3000
- [ ] Database migrations applied (check logs)
- [ ] No error messages in service logs

---

## DETAILED DEPLOYMENT PROCESS

### Phase 1: Pre-Deployment Validation

The script automatically validates:

```bash
✓ JAR file exists                    → /opt/aurigraph/app.jar
✓ Docker Compose file exists         → docker-compose-production.yml
✓ NGINX config exists               → config/nginx/nginx.conf
✓ Enterprise Portal built           → enterprise-portal/dist/
```

If JAR is missing, it will be built automatically:
```bash
./mvnw clean package -DskipTests -q
```

### Phase 2: Clean Remote Environment

**The script will remove ALL existing Docker resources:**

```bash
# Stop all containers
docker ps -q | xargs -r docker stop

# Remove all containers
docker ps -a -q | xargs -r docker rm -f

# Remove all volumes
docker volume ls -q | xargs -r docker volume rm

# Remove all custom networks
docker network ls -q | xargs -r docker network rm

# Clear /opt/DLT directory
rm -rf /opt/DLT/*

# Verify SSL certificates
ls -la /etc/letsencrypt/live/aurcrt/
```

### Phase 3: Prepare Deployment Files

Creates temporary deployment package with:
- Aurigraph V11 JAR (176 MB)
- docker-compose.yml with production config
- NGINX configuration file
- Environment variables (.env)
- Start script

### Phase 4: Transfer Files to Remote Server

Uses SCP to transfer:
```bash
JAR file (176 MB)               → /tmp/aurigraph-runner.jar
docker-compose.yml              → /tmp/docker-compose.yml
nginx.conf                       → /tmp/nginx.conf
.env file                        → /tmp/.env
```

### Phase 5: Execute Remote Deployment

On the remote server:

1. **Create directory structure**
   ```bash
   mkdir -p /opt/DLT/{data,logs,logs/nginx,ssl,html}
   ```

2. **Copy files to deployment folder**
   ```bash
   cp /tmp/docker-compose.yml /opt/DLT/
   cp /tmp/nginx.conf /opt/DLT/
   cp /tmp/.env /opt/DLT/
   cp /tmp/aurigraph-runner.jar /opt/DLT/app.jar
   ```

3. **Setup SSL certificates**
   ```bash
   cp /etc/letsencrypt/live/aurcrt/fullchain.pem /opt/DLT/ssl/
   cp /etc/letsencrypt/live/aurcrt/privkey.pem /opt/DLT/ssl/
   chmod 600 /opt/DLT/ssl/privkey.pem
   ```

4. **Build Docker image**
   ```bash
   cd /opt/DLT
   docker build -t aurigraph-v11:latest .
   ```

5. **Start services**
   ```bash
   cd /opt/DLT
   docker-compose up -d
   ```

6. **Wait for startup**
   ```bash
   sleep 30
   ```

### Phase 6: Deploy Enterprise Portal

1. **Create tarball of portal files**
   ```bash
   tar -czf portal.tar.gz -C enterprise-portal/dist .
   ```

2. **Transfer to remote server**
   ```bash
   scp -P22 portal.tar.gz subbu@dlt.aurigraph.io:/tmp/
   ```

3. **Extract on remote server**
   ```bash
   cd /opt/DLT/html
   tar -xzf /tmp/portal.tar.gz
   docker-compose exec -T nginx nginx -s reload
   ```

### Phase 7: Verification & Testing

```bash
# Test portal
curl -s https://dlt.aurigraph.io/ | head -20

# Test API
curl -s https://dlt.aurigraph.io/api/v11/info | jq .

# Test health
curl -s https://dlt.aurigraph.io/q/health | jq .

# Test metrics
curl -s https://dlt.aurigraph.io/q/metrics | head -20

# Check container status
docker-compose ps

# View logs
docker-compose logs quarkus | tail -50
```

---

## SERVICES OVERVIEW

### PostgreSQL Database

**Purpose**: Store blockchain state, transactions, user data

**Configuration**:
```yaml
Image: postgres:16-alpine
Port: 5432 (internal only)
Database: aurigraph
User: aurigraph
Password: ${DB_PASSWORD} (from .env)
```

**Health Check**:
```bash
docker-compose exec postgres pg_isready -U aurigraph
```

**Database Access**:
```bash
docker-compose exec postgres psql -U aurigraph -d aurigraph
```

**Key Tables** (created by Flyway migrations):
- `demos` (V1 migration)
- `bridge_transactions` (V2 migration)
- `users`, `roles`, `audit_logs` (schema)

### Redis Cache

**Purpose**: Session management, caching, real-time data

**Configuration**:
```yaml
Image: redis:7-alpine
Port: 6379 (internal only)
Memory Limit: 512 MB
Eviction Policy: allkeys-lru
```

**Health Check**:
```bash
docker-compose exec redis redis-cli ping
```

**Usage**:
```bash
docker-compose exec redis redis-cli
```

### Quarkus Backend

**Purpose**: Core blockchain platform, REST API, gRPC services

**Configuration**:
```yaml
Image: aurigraph-v11:latest (built locally)
Ports:
  - 9003: REST API
  - 9004: gRPC
Environment:
  - QUARKUS_PROFILE=prod
  - QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/aurigraph
  - QUARKUS_REDIS_HOSTS=redis:6379
  - CONSENSUS_TARGET_TPS=2000000
  - AI_OPTIMIZATION_ENABLED=true
```

**Health Check**:
```bash
curl http://localhost:9003/q/health
```

**REST API Endpoints**:
- `GET /api/v11/info` - Platform information
- `GET /api/v11/stats` - Statistics
- `GET /q/health` - Health check
- `GET /q/metrics` - Prometheus metrics

**Startup Time**: ~60 seconds (JVM)

### NGINX Reverse Proxy

**Purpose**: TLS termination, request routing, static file serving

**Configuration**:
```yaml
Image: nginx:1.25-alpine
Ports:
  - 80: HTTP (redirects to HTTPS)
  - 443: HTTPS
SSL Certificates:
  - /etc/nginx/ssl/fullchain.pem
  - /etc/nginx/ssl/privkey.pem
```

**Routing**:
```
/ (root)               → /usr/share/nginx/html (Portal)
/api/v11/*             → http://quarkus:9003 (API)
/q/health              → http://quarkus:9003 (Health)
/q/metrics             → http://quarkus:9003 (Metrics)
/ws/*                  → http://quarkus:9003 (WebSocket)
```

**Health Check**:
```bash
curl http://localhost/health
```

**NGINX Commands**:
```bash
# Test configuration
docker-compose exec nginx nginx -t

# Reload config (without restart)
docker-compose exec nginx nginx -s reload

# View config
docker-compose exec nginx cat /etc/nginx/nginx.conf
```

### Prometheus Monitoring

**Purpose**: Metrics collection and time-series data storage

**Configuration**:
```yaml
Image: prom/prometheus:latest
Port: 9090
Data Retention: 15 days
Web API: Enabled
Lifecycle: Enabled
```

**Access**:
- Web UI: http://dlt.aurigraph.io:9090
- Query Metrics: `http://localhost:9090/api/v1/query`

**Key Metrics**:
- `quarkus_http_server_requests_seconds_max` - HTTP request timing
- `jvm_memory_used_bytes` - Memory usage
- `process_uptime_seconds` - Service uptime

### Grafana Dashboard

**Purpose**: Metrics visualization and alerting

**Configuration**:
```yaml
Image: grafana/grafana:latest
Port: 3000
Admin Password: ${GRAFANA_PASSWORD} (from .env)
```

**Default Login**:
- Username: `admin`
- Password: `admin123` (from .env)

**Access**:
- Web UI: http://dlt.aurigraph.io:3000
- Data Source: Prometheus (http://prometheus:9090)

---

## TROUBLESHOOTING

### Container Won't Start

**Symptom**: Docker container fails to start

**Debug Steps**:
```bash
# Check logs
docker-compose logs quarkus

# Check if port is in use
lsof -i :9003

# Verify image exists
docker images | grep aurigraph

# Restart service
docker-compose restart quarkus
```

### Database Connection Failed

**Symptom**: "Connection to postgres:5432 refused"

**Debug Steps**:
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database is ready
docker-compose exec postgres pg_isready -U aurigraph

# Verify password
echo $DB_PASSWORD

# Check network connectivity
docker-compose exec quarkus ping postgres
```

### SSL Certificate Error

**Symptom**: "SSL certificate not found" or "certificate verify failed"

**Debug Steps**:
```bash
# Verify certificates exist
ls -la /opt/DLT/ssl/

# Check certificate validity
openssl x509 -in /opt/DLT/ssl/fullchain.pem -text -noout

# Test certificate
curl --cacert /opt/DLT/ssl/fullchain.pem https://dlt.aurigraph.io/
```

### Portal Not Loading

**Symptom**: HTTP 404 or JSON error response

**Debug Steps**:
```bash
# Check portal files exist
docker-compose exec nginx ls -la /usr/share/nginx/html/

# Test NGINX config
docker-compose exec nginx nginx -t

# Restart NGINX
docker-compose restart nginx

# Check NGINX logs
docker-compose logs nginx
```

### Performance Issues

**Symptom**: Slow API response times

**Debug Steps**:
```bash
# Check CPU usage
docker stats

# Check memory usage
docker-compose exec quarkus free -h

# Check disk I/O
iotop

# Check TPS
curl http://localhost:9003/api/v11/stats | jq .tps
```

---

## OPERATIONAL COMMANDS

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart quarkus

# View service status
docker-compose ps

# View service logs
docker-compose logs quarkus -f          # Follow logs
docker-compose logs --tail=100 quarkus   # Last 100 lines
docker-compose logs quarkus | tail -50   # Last 50 lines
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U aurigraph -d aurigraph

# Common SQL commands
\dt                    # List tables
SELECT * FROM users;   # Query table
\q                     # Quit psql
```

### Cache Management

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Common Redis commands
PING                   # Test connection
KEYS *                 # List all keys
DBSIZE                 # Number of keys
FLUSHDB                # Clear database
QUIT                   # Exit redis-cli
```

### Monitoring

```bash
# View metrics
curl http://localhost:9090/api/v1/query?query=up

# View Prometheus targets
curl http://localhost:9090/api/v1/targets

# View Grafana dashboards
curl http://localhost:3000/api/dashboards/home
```

### System Checks

```bash
# Check disk space
df -h /opt/DLT

# Check system memory
free -h

# Check network connections
netstat -tuln | grep LISTEN

# Check open files
lsof -p $(docker inspect -f '{{.State.Pid}}' aurigraph-quarkus)
```

---

## SECURITY CONFIGURATION

### SSL/TLS

**Certificate Setup**:
```bash
# Certificate paths on server
SSL_CERT=/etc/letsencrypt/live/aurcrt/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/aurcrt/privkey.pem

# Copied to Docker
/opt/DLT/ssl/fullchain.pem
/opt/DLT/ssl/privkey.pem
```

**Renewal** (Let's Encrypt):
```bash
# Manual renewal
certbot renew

# Auto-renewal (systemd timer)
sudo systemctl enable certbot-renew.timer
sudo systemctl status certbot-renew.timer
```

### Rate Limiting (NGINX)

Configured in nginx.conf:
- API endpoints: 100 req/s
- Admin endpoints: 10 req/s
- Authentication: 5 req/min

### Firewall Rules

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow internal services
sudo ufw allow from 172.28.0.0/16  # Docker network
```

### Data Security

- PostgreSQL password: Stored in `/opt/DLT/.env` (not in version control)
- Redis authentication: TBD (Redis runs on internal network only)
- API keys: Managed via environment variables

---

## MAINTENANCE & OPERATIONS

### Regular Tasks

**Daily**:
- Monitor service health
- Check error logs
- Verify database backups

**Weekly**:
- Review performance metrics
- Check disk usage
- Verify certificate validity

**Monthly**:
- Backup database
- Update Docker images
- Review security logs

### Backup & Recovery

**Database Backup**:
```bash
# Create backup
docker-compose exec postgres pg_dump -U aurigraph aurigraph > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U aurigraph aurigraph < backup.sql
```

**Volume Backup**:
```bash
# Backup PostgreSQL data
docker cp aurigraph-postgres:/var/lib/postgresql/data ./postgres-backup

# Backup Redis data
docker cp aurigraph-redis:/data ./redis-backup
```

**Disaster Recovery**:
```bash
# Remove failed container
docker-compose rm -f quarkus

# Restart from backup
docker-compose up -d quarkus
```

### Scaling & Performance

**Current Performance**:
- TPS: 776,000
- Target: 2,000,000+
- Startup: ~60 seconds (JVM)

**Optimization Opportunities**:
1. Native image compilation (reduce startup to <1s)
2. Horizontal scaling (multiple Quarkus instances)
3. Database optimization (indexing, connection pooling)
4. Caching layer optimization (Redis clustering)
5. NGINX performance tuning

---

## QUICK REFERENCE

### SSH Access

```bash
ssh -p22 subbu@dlt.aurigraph.io
```

### Production URLs

```
Portal:     https://dlt.aurigraph.io
API:        https://dlt.aurigraph.io/api/v11/
Health:     https://dlt.aurigraph.io/q/health
Metrics:    https://dlt.aurigraph.io/q/metrics
Prometheus: http://dlt.aurigraph.io:9090
Grafana:    http://dlt.aurigraph.io:3000
```

### Useful Commands

```bash
# Deployment
./CLEAN-PRODUCTION-DEPLOYMENT.sh

# Service status
docker-compose ps

# Service logs
docker-compose logs quarkus -f

# Health check
curl https://dlt.aurigraph.io/q/health

# Database
docker-compose exec postgres psql -U aurigraph -d aurigraph

# Cache
docker-compose exec redis redis-cli

# Database backup
docker-compose exec postgres pg_dump -U aurigraph aurigraph > backup.sql
```

---

## SUPPORT & CONTACT

For deployment issues:
- Check logs: `docker-compose logs <service>`
- Review troubleshooting section
- SSH to server: `ssh -p22 subbu@dlt.aurigraph.io`

---

**Deployment Date**: November 1, 2025
**Last Updated**: November 1, 2025
**Version**: 1.0
**Status**: ✅ Ready for Production

