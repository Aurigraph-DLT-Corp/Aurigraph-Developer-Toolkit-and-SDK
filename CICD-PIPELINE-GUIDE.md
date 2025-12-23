# Automated CI/CD Pipeline Guide

## Overview

This guide explains the production-ready **Aurigraph Automated CI/CD Pipeline** for flawless, stable, reliable, and robust deployment of the entire platform (V11 nodes + Enterprise Portal + Infrastructure) to remote servers.

**Key Features:**
- ✅ Multi-phase automated deployment (7 phases)
- ✅ Comprehensive error handling & rollback capability
- ✅ Health verification & monitoring
- ✅ Pre-flight validation before deployment
- ✅ Logging and audit trail
- ✅ Zero-downtime deployment strategy
- ✅ SSH-based remote deployment
- ✅ Docker image registry integration (GitHub Container Registry)

## Quick Start

### Basic Deployment
```bash
# Navigate to repository root
cd ~/Aurigraph-DLT

# Make script executable
chmod +x AUTOMATED-CICD-PIPELINE.sh

# Run deployment
./AUTOMATED-CICD-PIPELINE.sh deploy
```

### Check Deployment Logs
```bash
./AUTOMATED-CICD-PIPELINE.sh logs
```

### Rollback Deployment
```bash
./AUTOMATED-CICD-PIPELINE.sh rollback
```

## Deployment Phases

### Phase 1: Pre-Flight Checks
Validates environment before deployment begins:
- Git repository integrity
- Docker availability
- SSH connectivity to remote server
- Docker availability on remote server
- Docker image status verification

### Phase 2: Build V11 JAR
Compiles Aurigraph V11 Java application:
- Runs Maven clean build
- Skips tests for speed (can be customized)
- Verifies JAR artifact at `target/quarkus-app/quarkus-run.jar`
- Reports build size and location

### Phase 3: Build Docker Image
Creates Docker image from compiled JAR:
- Builds from `Dockerfile.jvm` (or creates minimal Dockerfile)
- Tags image as `aurigraph-v11:11.0.0`
- Attaches metadata (version, commit hash, build date)
- Verifies image after build

### Phase 4: Push to Registry
Uploads Docker image to GitHub Container Registry:
- Authenticates using `GITHUB_TOKEN`
- Tags image with registry prefix
- Pushes to `ghcr.io/Aurigraph-DLT-Corp/Aurigraph-DLT`
- Skips if token not configured (uses local image)

### Phase 5: Deploy to Remote Server
Deploys complete platform to production server:
- SSH to remote server (`subbu@dlt.aurigraph.io`)
- Creates docker-compose.deploy.yml configuration
- Deploys 5 node types:
  - Validator nodes (consensus - 2 instances)
  - Business nodes (smart contracts - 1 instance)
  - Slim nodes (light clients - 1 instance)
  - Archive nodes (full history - 1 instance)
- Waits 20 seconds for services to stabilize
- Verifies all infrastructure services active

### Phase 6: Verification
Validates deployment health:
- Checks each node's HTTP health endpoint
- Verifies 3+ nodes are healthy (success threshold)
- Reports node status on each port

### Phase 7: Health Monitoring
Continues monitoring for 5 minutes:
- Health checks every 30 seconds
- Reports nodes healthy count
- Ensures stability after deployment
- Alerts if issues detected

## Configuration

### Environment Variables

Set before running script:

```bash
# Remote server configuration
export REMOTE_USER="subbu"
export REMOTE_HOST="dlt.aurigraph.io"
export REMOTE_PORT="22"
export REMOTE_DIR="~/Aurigraph-DLT"

# Docker configuration
export DOCKER_REGISTRY="ghcr.io"
export GITHUB_REPO="Aurigraph-DLT-Corp/Aurigraph-DLT"
export VERSION="11.0.0"

# GitHub authentication (for registry push)
export GITHUB_TOKEN="ghp_xxxxx..."
export GITHUB_ACTOR="username"

# Git information (auto-detected)
export GIT_COMMIT="abc1234"
```

### SSH Configuration

Ensure SSH public key is authorized on remote:

```bash
# Copy your SSH key to remote
ssh-copy-id -p 22 subbu@dlt.aurigraph.io

# Test connection
ssh -p 22 subbu@dlt.aurigraph.io "echo 'SSH works'"
```

## Deployment Artifacts

Nodes deployed to remote server:

| Node Type | Ports | Role | Memory |
|-----------|-------|------|--------|
| Validator 1 | 9005 | Consensus | 512MB |
| Validator 2 | 9006 | Consensus | 512MB |
| Business 1 | 9020 | Transactions | 768MB |
| Slim 1 | 9040 | Light client | 256MB |
| Archive 1 | 9090 | Full history | 768MB |

### Health Endpoints
All nodes expose Quarkus health at:
```
http://localhost:PORT/q/health
http://localhost:PORT/q/metrics
```

## Error Handling

### Automatic Rollback
If deployment fails, script automatically:
1. Stops failed deployment
2. Restarts from backup compose file
3. Falls back to original configuration
4. Logs all rollback actions

### Debugging
Check logs for detailed error information:

```bash
# View full deployment log
tail -f ~/.cicd-logs/deployment-*.log

# Monitor specific node
ssh -p 22 subbu@dlt.aurigraph.io "docker logs -f validator-node-1"

# Check remote Docker status
ssh -p 22 subbu@dlt.aurigraph.io "docker ps"
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check all nodes
for port in 9005 9006 9020 9040 9090; do
    curl -s http://localhost:$port/q/health
done

# Check via SSH
ssh -p 22 subbu@dlt.aurigraph.io "docker ps"
```

### Performance Metrics
```bash
# Access Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# View Grafana dashboard
open http://dlt.aurigraph.io:3000
```

### Container Management
```bash
# Stop all deployments
docker-compose -f docker-compose.deploy.yml down

# Restart services
docker-compose -f docker-compose.deploy.yml up -d

# View logs
docker-compose -f docker-compose.deploy.yml logs -f
```

## Security Best Practices

1. **SSH Keys**
   - Use dedicated deployment key
   - Rotate keys every 6-12 months
   - Restrict key permissions (600)

2. **GitHub Token**
   - Use fine-grained personal access tokens
   - Set expiration date (90 days)
   - Rotate tokens regularly
   - Never commit tokens to Git

3. **Docker Registry**
   - Authenticate before push
   - Use short-lived credentials
   - Monitor registry access logs

4. **Remote Access**
   - Use SSH key authentication (no passwords)
   - Restrict SSH to specific IPs
   - Enable SSH audit logging
   - Monitor failed login attempts

## Troubleshooting

### SSH Connection Failed
```bash
# Test SSH connection
ssh -p 22 subbu@dlt.aurigraph.io "echo 'OK'"

# Check SSH key permissions
ls -la ~/.ssh/id_rsa  # Should be 600

# Verify key on remote
ssh -p 22 subbu@dlt.aurigraph.io "cat ~/.ssh/authorized_keys"
```

### Docker Build Failed
```bash
# Check Docker daemon
docker ps

# Verify Dockerfile exists
ls -la aurigraph-av10-7/aurigraph-v11-standalone/Dockerfile*

# Try manual build
cd aurigraph-av10-7/aurigraph-v11-standalone
docker build -f Dockerfile.jvm -t aurigraph-v11:11.0.0 .
```

### Health Check Failed
```bash
# Check if port is accessible
curl http://localhost:9005/q/health

# Check container logs
docker logs validator-node-1

# Verify port mapping
docker inspect validator-node-1 | grep PortBindings

# Check network
docker network inspect dlt-backend
```

### Registry Push Failed
```bash
# Verify GitHub token
echo $GITHUB_TOKEN

# Test registry login
docker login ghcr.io -u $GITHUB_ACTOR --password-stdin <<< $GITHUB_TOKEN

# Check token permissions
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user/packages
```

## Advanced Usage

### Custom Configuration
```bash
# Deploy with custom settings
VERSION="11.1.0" \
REMOTE_HOST="staging.example.com" \
REMOTE_DIR="/opt/aurigraph" \
./AUTOMATED-CICD-PIPELINE.sh deploy
```

### Dry Run (Without Deployment)
```bash
# Just run pre-flight checks
bash -c '
source AUTOMATED-CICD-PIPELINE.sh
preflight_checks
'
```

### Manual Phase Execution
```bash
# Just build JAR
bash -c '
source AUTOMATED-CICD-PIPELINE.sh
build_v11_jar
'

# Just build Docker image
bash -c '
source AUTOMATED-CICD-PIPELINE.sh
build_docker_image
'
```

## Integration with CI/CD Systems

### GitHub Actions Example
```yaml
name: Deploy Aurigraph

on:
  push:
    branches: [ main ]
    paths:
      - 'aurigraph-av10-7/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      VERSION: ${{ github.sha }}
      REMOTE_USER: subbu
      REMOTE_HOST: dlt.aurigraph.io
      REMOTE_PORT: 22
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      DEPLOY_SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
      
      - name: Run CI/CD Pipeline
        run: ./AUTOMATED-CICD-PIPELINE.sh deploy
```

### GitLab CI Example
```yaml
deploy:
  stage: deploy
  script:
    - chmod +x AUTOMATED-CICD-PIPELINE.sh
    - ./AUTOMATED-CICD-PIPELINE.sh deploy
  environment:
    name: production
    url: https://dlt.aurigraph.io
  only:
    - main
```

## Performance Metrics

Expected deployment times:
- Pre-flight checks: ~10 seconds
- V11 JAR build: ~2-3 minutes (cached: ~30 seconds)
- Docker image build: ~1-2 minutes
- Registry push: ~30 seconds
- Remote deployment: ~2 minutes
- Health monitoring: ~5 minutes
- **Total: ~12-15 minutes** (first run with new image)
- **Total: ~6-8 minutes** (subsequent runs with cached image)

## Support & Maintenance

### Regular Maintenance Tasks

```bash
# Clean up old logs (weekly)
find ~/.cicd-logs -mtime +30 -delete

# Clean up Docker images (monthly)
docker image prune -a --filter "until=720h"

# Verify deployment (daily)
./AUTOMATED-CICD-PIPELINE.sh logs | tail -20
```

### Monitoring Dashboard
```bash
# View Grafana monitoring
open https://dlt.aurigraph.io:3000

# Default credentials: admin/admin
```

## Related Documentation

- `CLAUDE.md` - Development guidance
- `.github/workflows/build-and-deploy.yml` - GitHub Actions workflow
- `aurigraph-av10-7/DEPLOYMENT-GUIDE.md` - Deployment details
- `aurigraph-av10-7/GITHUB-SECRETS-SETUP.md` - Secrets configuration
- `ARCHITECTURE.md` - System architecture
