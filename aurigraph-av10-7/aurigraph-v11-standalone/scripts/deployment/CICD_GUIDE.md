# Aurigraph V12 CI/CD Deployment Guide

## Overview

This guide covers the CI/CD pipeline for deploying Aurigraph V12 to the production server at `dlt.aurigraph.io`.

## Architecture

The deployment creates a multi-node architecture:

| Node Type | Count | Ports | Memory | Purpose |
|-----------|-------|-------|--------|---------|
| Validator | 5 | 19001-19005 | 2.5GB | Consensus & validation |
| Business | 3 | 19010-19012 | 1.2GB | Business logic processing |
| Slim | 3 | 19020-19022 | 1GB | External API integration |

**Total: 11 nodes**

## Deployment Methods

### 1. GitHub Actions (Automated)

The workflow triggers automatically on:
- Push to `main` or `V12` branches
- Manual trigger via GitHub Actions UI

**Workflow file:** `.github/workflows/remote-deployment.yml`

**To trigger manually:**
1. Go to GitHub Actions
2. Select "Remote Server Deployment"
3. Click "Run workflow"
4. Choose options:
   - `skip_tests`: Skip tests during build (default: true)
   - `force_deploy`: Deploy even if health check fails
   - `deploy_mode`: rolling | full-restart | validators-only | business-only | slim-only

### 2. Local Script (Manual)

```bash
# From project root
cd aurigraph-av10-7/aurigraph-v11-standalone

# Full deployment
./scripts/deployment/deploy-to-remote.sh

# Deploy specific node types
./scripts/deployment/deploy-to-remote.sh validators-only
./scripts/deployment/deploy-to-remote.sh business-only
./scripts/deployment/deploy-to-remote.sh slim-only
```

## GitHub Secrets Required

| Secret | Description | Updated |
|--------|-------------|---------|
| `PROD_SSH_PRIVATE_KEY` | SSH private key for server access | Nov 30, 2025 |
| `SERVER_HOST` | Remote server hostname | Sep 22, 2025 |
| `SERVER_USERNAME` | SSH username | Sep 22, 2025 |
| `SERVER_PORT` | SSH port | Sep 22, 2025 |

## Deployment Process

1. **Build Phase**
   - Maven builds the Quarkus application
   - Creates `target/quarkus-app/quarkus-run.jar`

2. **Package Phase**
   - Creates tar archive of quarkus-app directory
   - Includes: JAR, lib/, quarkus/, app/

3. **Upload Phase**
   - SCP transfer to remote server
   - Stored in `/home/subbu/aurigraph-v12/`

4. **Deploy Phase**
   - Backs up existing JAR
   - Extracts new deployment
   - Restarts Docker containers with new JAR

5. **Verify Phase**
   - Health checks all 11 nodes
   - Tests public API endpoints
   - Reports deployment status

## Docker Configuration

Each container is configured with:

```bash
docker run -d \
  --name aurigraph-{type}-{n} \
  --network nodes_aurigraph-network \
  --restart unless-stopped \
  -p {port}:9003 \
  -p {grpc}:9004 \
  -v /home/subbu/aurigraph-v12/aurigraph-v12.jar:/app/aurigraph-v12.jar:ro \
  -v /home/subbu/aurigraph-v12/lib:/app/lib:ro \
  -m {memory_limit} \
  eclipse-temurin:21-jre-alpine \
  java -Xms{min} -Xmx{max} -XX:+UseG1GC \
  -Dquarkus.datasource.jdbc.url=jdbc:postgresql://172.28.0.1:5432/j4c_db \
  -Dquarkus.datasource.username=j4c_user \
  -Dquarkus.datasource.password=j4c_password \
  -Dquarkus.flyway.enabled=false \
  -jar /app/aurigraph-v12.jar
```

## Network Configuration

- **Docker Network:** `nodes_aurigraph-network`
- **Database:** PostgreSQL at `172.28.0.1:5432/j4c_db`
- **Public Access:** Via Nginx reverse proxy on port 443

## Health Check Endpoints

```bash
# Public endpoints
curl https://dlt.aurigraph.io/q/health
curl https://dlt.aurigraph.io/api/v12/info
curl https://dlt.aurigraph.io/api/v12/composite-tokens
curl https://dlt.aurigraph.io/api/v12/activecontracts

# Internal node health (via SSH)
for port in 19001 19002 19003 19004 19005 19010 19011 19012 19020 19021 19022; do
  curl -s http://localhost:$port/q/health
done
```

## Troubleshooting

### Node won't start
```bash
# Check container logs
docker logs aurigraph-validator-1

# Common issues:
# - OOM: Increase memory limit
# - DB connection: Check network and credentials
# - Port conflict: Check if port is available
```

### Health check fails
```bash
# Wait for startup (60-90 seconds)
# Check if container is running
docker ps | grep aurigraph

# Check resource usage
docker stats --no-stream | grep aurigraph
```

### Rollback
```bash
ssh -p 22 subbu@dlt.aurigraph.io
cd /home/subbu/aurigraph-v12

# List backups
ls -la aurigraph-v12.jar.backup.*

# Restore previous version
cp aurigraph-v12.jar.backup.{timestamp} aurigraph-v12.jar

# Restart all nodes
docker restart $(docker ps -q --filter "name=aurigraph")
```

## Monitoring

After deployment, verify:
1. All 11 containers are running
2. Health endpoints return 200
3. API endpoints respond correctly
4. No OOM kills in `docker stats`

```bash
# Quick status check
docker ps --format "table {{.Names}}\t{{.Status}}" | grep aurigraph | head -15
```
