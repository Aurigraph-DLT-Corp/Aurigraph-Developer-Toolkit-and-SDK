---
description: Setup and activate CI/CD pipeline for remote deployment
---

# CI/CD Setup and Activation Workflow

Your Aurigraph-DLT project has a complete CI/CD pipeline already configured. This workflow helps you activate and test it.

## Overview

The CI/CD pipeline automatically deploys your Aurigraph V11 platform to your remote server (`dlt.aurigraph.io`) whenever you push code to the `main` or `develop` branches.

**Pipeline Features:**
- ✅ Automatic build and Docker image creation
- ✅ Blue-green deployment (zero downtime)
- ✅ Health checks before going live
- ✅ Automatic rollback on failure
- ✅ Slack notifications
- ✅ 5-minute post-deployment monitoring

---

## Prerequisites Check

Before activating the CI/CD pipeline, verify:

### 1. SSH Access to Remote Server
```bash
ssh -p 2235 subbu@dlt.aurigraph.io
```

### 2. Docker Installed on Remote Server
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "docker --version && docker-compose --version"
```

### 3. GitHub CLI Installed (optional but recommended)
```bash
gh --version
```

---

## Setup Steps

### Step 1: Generate SSH Deployment Key

// turbo
```bash
ssh-keygen -t ed25519 -f ~/.ssh/aurigraph-deploy-key -N "" -C "aurigraph-cicd-deploy"
```

### Step 2: Add Public Key to Remote Server

```bash
cat ~/.ssh/aurigraph-deploy-key.pub
```

Copy the output and add it to the remote server:

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "mkdir -p ~/.ssh && echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Step 3: Configure GitHub Secrets

**Option A: Using GitHub CLI (Recommended)**

// turbo
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
gh secret set PROD_SSH_KEY < ~/.ssh/aurigraph-deploy-key
gh secret set PROD_HOST -b "dlt.aurigraph.io"
gh secret set PROD_USER -b "subbu"
```

**Option B: Using Web Interface**

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:
   - `PROD_SSH_KEY`: Content of `~/.ssh/aurigraph-deploy-key`
   - `PROD_HOST`: `dlt.aurigraph.io`
   - `PROD_USER`: `subbu`

### Step 4: (Optional) Configure Slack Notifications

If you want deployment notifications in Slack:

1. Create webhook: https://api.slack.com/messaging/webhooks
2. Add to GitHub secrets:

```bash
gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Step 5: Verify Secrets Are Configured

// turbo
```bash
gh secret list
```

You should see:
- PROD_HOST
- PROD_SSH_KEY
- PROD_USER
- SLACK_WEBHOOK_URL (optional)

### Step 6: Setup Remote Directories

```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
mkdir -p /opt/aurigraph/{production,staging,backups}
cd /opt/aurigraph/production
# Clone the repository if not already present
if [ ! -d ".git" ]; then
    git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git .
fi
EOF
```

---

## Testing the Pipeline

### Test 1: Manual Staging Deployment

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Click "Remote Server CI/CD Deployment"
3. Click "Run workflow"
4. Select:
   - **Branch**: `main`
   - **Deployment target**: `staging`
   - **Deployment strategy**: `blue-green`
   - **Skip tests**: ✓ (for faster test)
5. Click "Run workflow"
6. Monitor the execution (~15-20 minutes)

### Test 2: Verify Deployment

After the workflow completes:

// turbo
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "docker ps"
```

// turbo
```bash
curl https://dlt.aurigraph.io/api/v11/health
```

### Test 3: Check Deployment Logs

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs aurigraph-v11 --tail 50"
```

---

## Automatic Deployment Triggers

Once verified, the pipeline will automatically deploy when:

1. **Push to `main` branch** → Production deployment
2. **Push to `develop` branch** → Staging deployment
3. **Changes to these paths**:
   - `aurigraph-av10-7/aurigraph-v11-standalone/**`
   - `docker-compose*.yml`
   - `deployment/**`

---

## Deployment Strategies

### Blue-Green (Default)
```
Zero downtime deployment
- New version deployed alongside current version
- Traffic switched after health checks pass
- Instant rollback if issues detected
```

### Canary
```
Gradual rollout
- 5% traffic to new version initially
- Monitor error rates
- Gradually increase if stable
```

### Rolling
```
One instance at a time
- Good for large clusters
- Minimal resource overhead
```

---

## Monitoring Deployment

### View Workflow Logs
1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Click the running workflow
3. Monitor each phase

### Check Remote Server
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== Service Health ==="
curl -s http://localhost:9004/q/health | jq '.'

echo -e "\n=== Disk Usage ==="
df -h /opt/aurigraph
EOF
```

---

## Rollback Procedure

### Automatic Rollback
The pipeline automatically rolls back if:
- Health checks fail
- Container crashes
- API doesn't respond

### Manual Rollback
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
cd /opt/aurigraph/production

# Find latest backup
BACKUP=$(ls -t /opt/aurigraph/backups/pre-deploy-* | head -1)
echo "Using backup: $BACKUP"

# Stop current deployment
docker-compose down

# Restore database
zcat $BACKUP/aurigraph-db.sql.gz | docker exec -i dlt-postgres psql -U aurigraph aurigraph_production

# Restart with previous version
docker-compose up -d

# Wait and check
sleep 30
curl http://localhost:9004/q/health
EOF
```

---

## Troubleshooting

### Issue: SSH Connection Failed
```bash
# Test SSH manually
ssh -p 2235 -v subbu@dlt.aurigraph.io

# Verify key permissions
chmod 600 ~/.ssh/aurigraph-deploy-key
```

### Issue: Docker Build Failed
Check workflow logs for Maven build errors:
1. Go to Actions tab
2. Click failed workflow
3. Expand "Build V11 project" step

### Issue: Health Checks Timeout
```bash
# Check service logs on remote
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs aurigraph-v11 --tail 100"
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs dlt-postgres --tail 50"
```

### Issue: Port Already in Use
```bash
# Check what's using the port
ssh -p 2235 subbu@dlt.aurigraph.io "netstat -tlnp | grep -E '9003|9004|3000|80|443'"

# Stop conflicting containers
ssh -p 2235 subbu@dlt.aurigraph.io "docker ps -a | grep -v 'CONTAINER'"
```

---

## Quick Reference Commands

### Check CI/CD Status
```bash
# View GitHub secrets
gh secret list

# View recent workflow runs
gh run list --workflow=remote-deployment.yml --limit 5

# Watch latest workflow
gh run watch
```

### Remote Server Quick Checks
```bash
# One-liner health check
ssh -p 2235 subbu@dlt.aurigraph.io "docker ps && curl -s http://localhost:9004/q/health | jq '.status'"

# View all service logs
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/aurigraph/production && docker-compose logs --tail=20"
```

---

## Success Criteria

✅ GitHub secrets configured
✅ SSH connection works
✅ Remote directories exist
✅ Docker is running on remote server
✅ Test deployment succeeded
✅ Health checks passing
✅ API endpoints responding
✅ Portal accessible

---

## Next Steps After Setup

1. **Enable Branch Protection**
   - Require CI/CD to pass before merge
   - Require code review

2. **Setup Monitoring**
   - Configure Slack notifications
   - Add Grafana dashboards
   - Setup alerts

3. **Document Deployment Process**
   - Update team wiki
   - Create runbooks

4. **Schedule Regular Deployments**
   - Weekly maintenance window
   - Hot-fix procedures

---

## Files and Documentation

- **Main Workflow**: `.github/workflows/remote-deployment.yml`
- **Setup Script**: `.github/setup-remote-deployment.sh`
- **Full Guide**: `.github/REMOTE_DEPLOYMENT_SETUP.md`
- **Summary**: `.github/CI_CD_DEPLOYMENT_COMPLETE.md`

---

**Status**: Ready for production use
**Last Updated**: 2025-11-25
**Contact**: DevOps Team
