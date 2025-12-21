# Aurigraph V11 Node Deployment Guide

## Overview

This guide covers deploying Aurigraph V11 node variants (Validator, Business, Integration) to production environments using GitHub Actions CI/CD and remote deployment scripts.

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/build-and-deploy.yml` and performs the following:

1. **Build Phase**: Compiles Docker images for each node type and build variant
2. **Test Phase**: Validates images before deployment
3. **Deploy Phase**: Deploys to remote server on main branch pushes

### Triggering Deployments

#### Automatic Deployment (on push to main)
```bash
git push origin main
```
Automatically builds and deploys all production images.

#### Manual Workflow Dispatch
Go to GitHub Actions → "Build and Deploy Aurigraph V11 Node Variants" → Run workflow

Select:
- Node type: `validator`, `business`, `integration`, or `all`
- Build variant: `dev`, `staging`, `prod`, or `all`

### Required Secrets

Configure these in GitHub Settings → Secrets:

```
DEPLOY_SSH_KEY        - SSH private key for dlt.aurigraph.io
GITHUB_TOKEN          - Auto-generated (default)
DOCKER_REGISTRY       - ghcr.io (GitHub Container Registry)
```

## Remote Deployment Script

### Setup

1. **Configure SSH Access**
```bash
# Copy SSH key to local machine
ssh-copy-id -p 22 subbu@dlt.aurigraph.io

# Test connection
ssh -p 22 subbu@dlt.aurigraph.io "echo 'Connection successful'"
```

2. **Deploy Script Location**
```
./deploy-remote.sh
```

### Usage

#### Deploy All Nodes (Production)
```bash
./deploy-remote.sh all prod
```

#### Deploy Specific Node Type
```bash
# Validator nodes
./deploy-remote.sh validator prod

# Business nodes
./deploy-remote.sh business prod

# Integration nodes
./deploy-remote.sh integration prod
```

#### Deploy All Variants
```bash
./deploy-remote.sh all all
```

### Environment Variables

Override defaults with environment variables:
```bash
# Set remote user (default: subbu)
export REMOTE_USER=your_username

# Set remote host (default: dlt.aurigraph.io)
export REMOTE_HOST=your.server.com

# Set remote port (default: 22)
export REMOTE_PORT=2235

# Set deployment directory
export REMOTE_DIR=~/path/to/aurigraph
```

Full deployment with custom settings:
```bash
REMOTE_USER=deploy \
REMOTE_HOST=production.server.com \
REMOTE_PORT=2235 \
./deploy-remote.sh all prod
```

## Docker Compose Deployment

### Production Deployment

The `docker-compose.prod.yml` defines the complete production stack:

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Services Deployed

**Consensus Nodes:**
- `validator-node-1` - Validator instance 1 (port 9003)
- `validator-node-2` - Validator instance 2 (port 9005)

**Transaction Nodes:**
- `business-node-1` - Business instance 1 (port 9020)
- `business-node-2` - Business instance 2 (port 9021)

**Query Nodes:**
- `integration-node-1` - Integration instance 1 (port 9040)
- `integration-node-2` - Integration instance 2 (port 9041)

**Infrastructure:**
- `postgres` - PostgreSQL database (port 5432)
- `redis` - Redis cache (port 6379)
- `prometheus` - Metrics collection (port 9090)
- `grafana` - Monitoring dashboard (port 3000)

### Network

All services connect via `aurigraph-backend` bridge network for internal communication.

### Persistent Volumes

Each node has dedicated volumes for data and logs:
- `validator-data-{1,2}`
- `validator-logs-{1,2}`
- `business-data-{1,2}`
- `business-logs-{1,2}`
- `business-contracts-{1,2}`
- `integration-data-{1,2}`
- `integration-logs-{1,2}`
- `integration-cache-{1,2}`

### Health Checks

Each service includes health checks that verify:
- REST API endpoint availability
- Service readiness
- Automatic restart on failure

View health status:
```bash
docker ps
docker inspect <container-name> --format='{{.State.Health.Status}}'
```

## Deployment Workflow

### Step 1: Code Changes
Make changes to Dockerfiles or configuration in your feature branch:
```bash
git checkout -b feature/update-validator-config
# Make changes
git add .
git commit -m "Update validator configuration"
git push origin feature/update-validator-config
```

### Step 2: Create Pull Request
Create PR to merge into `main` branch. GitHub Actions will:
- Build all variants
- Run tests
- Comment on PR with build status

### Step 3: Merge and Deploy
When PR is approved and merged to main:
1. GitHub Actions automatically builds all images
2. Images are pushed to GitHub Container Registry
3. Deployment pipeline pulls latest images
4. Services are updated on dlt.aurigraph.io
5. Health checks validate deployment

### Step 4: Verify Deployment
```bash
# SSH to server
ssh subbu@dlt.aurigraph.io

# Check running containers
docker ps | grep aurigraph

# View logs
docker logs validator-node-1
docker logs business-node-1

# Test API endpoints
curl http://localhost:9003/q/health
curl http://localhost:9020/q/health
curl http://localhost:9040/q/health

# Monitor metrics
open http://dlt.aurigraph.io:3000  # Grafana
open http://dlt.aurigraph.io:9090  # Prometheus
```

## Rollback Procedure

If deployment fails, rollback to previous version:

```bash
# On remote server
docker-compose -f docker-compose.prod.yml down

# Pull previous image version
docker pull ghcr.io/aurigraph-dlt-corp/aurigraph/aurigraph-validator:main-prod

# Redeploy
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Logs

### View Real-time Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f validator-node-1

# Tail last 100 lines
docker logs --tail 100 validator-node-1
```

### Check Metrics
```bash
# Prometheus metrics endpoint
curl http://localhost:9090/api/v1/query?query=up

# Node health status
curl http://localhost:9003/q/health
curl http://localhost:9020/q/health
curl http://localhost:9040/q/health
```

### Monitor Performance
- **Grafana**: http://dlt.aurigraph.io:3000 (Default: admin/admin)
- **Prometheus**: http://dlt.aurigraph.io:9090

## Troubleshooting

### Deployment Fails
1. Check SSH connection: `ssh subbu@dlt.aurigraph.io "echo OK"`
2. View deployment logs: `gh run view <run-id> --log`
3. Check remote Docker: `ssh subbu@dlt.aurigraph.io "docker ps"`

### Health Check Failures
1. Check container logs: `docker logs <container>`
2. Verify port availability: `lsof -i :9003`
3. Check network connectivity: `docker network inspect aurigraph-backend`

### Database Connection Issues
1. Verify PostgreSQL is running: `docker ps | grep postgres`
2. Test connection: `psql -h localhost -U aurigraph -d aurigraph_v11`
3. Check credentials in `.env` file

### Image Pull Failures
1. Authenticate to registry: `docker login ghcr.io`
2. Check image exists: `docker pull ghcr.io/aurigraph-dlt-corp/aurigraph/aurigraph-validator:main-prod`
3. Verify GitHub token permissions

## Best Practices

1. **Always test in staging first**
   ```bash
   ./deploy-remote.sh all staging
   ```

2. **Monitor deployment progress**
   ```bash
   watch -n 5 'docker ps | grep aurigraph'
   ```

3. **Keep backups of persistent data**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U aurigraph aurigraph_v11 > backup.sql
   ```

4. **Update secrets regularly**
   - Rotate GitHub token quarterly
   - Update database passwords
   - Refresh SSH keys annually

5. **Use semantic versioning**
   - Dev builds: v11.0.0-dev
   - Staging builds: v11.0.0-staging
   - Production builds: v11.0.0

## Support

For issues or questions:
1. Check logs: `docker logs <service>`
2. Review documentation: See `RELEASES.md`
3. Contact team: See project README

