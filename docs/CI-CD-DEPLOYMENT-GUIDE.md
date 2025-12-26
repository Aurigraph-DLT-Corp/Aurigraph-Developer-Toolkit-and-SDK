# CI/CD Deployment Guide
**Aurigraph DLT V11 - Remote Server Deployment Using Self-Hosted Runners**

---

## Overview

This guide covers the complete CI/CD pipeline for deploying Aurigraph V11 to your remote server (dlt.aurigraph.io) using GitHub Actions with self-hosted runners.

**Architecture**:
```
GitHub Repository
    ↓ Push to main
GitHub Actions (Self-Hosted Runner)
    ↓
[Quality Gates] → [Build] → [Pre-Deployment] → [Deploy] → [Health Check]
    ↓
Remote Server (dlt.aurigraph.io:9003)
```

---

## Quick Start

### Prerequisites
- ✅ GitHub repository configured
- ✅ SSH access to dlt.aurigraph.io:2235
- ✅ Java 21 installed on remote server
- ✅ Docker installed and running
- ✅ Self-hosted runner registered

### Deploy Latest Build

**Option 1: Automatic (GitHub Push)**
```bash
# Push to main branch triggers deployment
git push origin main
```

**Option 2: Manual Trigger**
```bash
# Trigger deployment manually
gh workflow run deploy-to-remote.yml \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT \
  -f environment=staging
```

**Option 3: Direct Script**
```bash
# Run deployment script directly
./scripts/ci-cd/deploy-to-remote.sh
```

---

## Workflows Explained

### 1. Test Quality Gates Workflow
**File**: `.github/workflows/test-quality-gates.yml`

**Triggers**:
- Push to main/develop/feature branches
- Pull requests
- Manual trigger (`workflow_dispatch`)

**Jobs**:
```
Unit Tests (10 min)
    ↓ (parallel)
Integration Tests (20 min)
    ↓ (parallel)
Code Coverage (30 min)
    ↓ (parallel)
Code Quality Analysis (15 min)
    ↓
Quality Gate Summary
```

**Example Output**:
```
✅ Unit Tests PASSED (212 tests)
✅ Integration Tests PASSED (18 tests)
✅ Coverage Check PASSED (75% line coverage)
✅ Code Quality PASSED
✅ ALL QUALITY GATES PASSED!
```

### 2. Deploy to Remote Workflow
**File**: `.github/workflows/deploy-to-remote.yml`

**Triggers**:
- Push to main branch
- Manual trigger with environment selection

**Jobs**:
```
Quality Gates (60 min)
    ↓
Build Application (30 min)
    ↓
Pre-Deployment Backup (15 min)
    ↓
Deploy to Remote (20 min)
    ↓
Start Service (10 min)
    ↓
Health Check (10 min)
    ↓
Smoke Tests (10 min)
    ↓
Deployment Summary
```

**Deployment Steps**:
1. Verify all quality gates pass
2. Build JAR artifact
3. Create backup of current version
4. Upload and extract JAR on remote
5. Start Java service
6. Wait for health checks
7. Run smoke tests
8. Report status

---

## Detailed Workflow Steps

### Quality Gates Job

**Runs**:
- `./mvnw clean verify` - Full test suite with coverage
- JaCoCo coverage validation
- Compilation checks
- Surefire test reports

**Success Criteria**:
- ✅ All 212+ tests pass
- ✅ 0 compilation errors
- ✅ Coverage ≥ 75% overall
- ✅ No JaCoCo gate violations

**Failure Action**: Blocks deployment

### Build Job

**Runs**:
- `./mvnw clean package -DskipTests` - Creates JAR
- Generates build metadata
- Uploads artifact to GitHub

**Artifacts**:
- `aurigraph-v11-build-<RUN_ID>/quarkus-app/quarkus-run.jar`
- Build information JSON
- Available for 90 days

**Failure Action**: Blocks deployment

### Pre-Deployment Job

**Remote Actions**:
- Creates `/opt/aurigraph/backups` directory
- Backs up current `/opt/aurigraph/v11` if it exists
- Keeps last 5 backups (auto-cleans older ones)
- Creates app directory if first deployment

**Backup Location**: `/opt/aurigraph/backups/aurigraph-v11-backup-YYYYMMDD_HHMMSS`

**Failure Action**: Blocks deployment

### Deploy Job

**Remote Actions**:
1. Stop current service: `pkill -f quarkus-run.jar`
2. Extract JAR: `tar -xzf deployment.tar.gz`
3. Set permissions: `chmod +x quarkus-run.jar`
4. Clean temporary files

**Expected Duration**: 2-5 minutes

**Failure Action**: Blocks service start

### Start Service Job

**Remote Command**:
```bash
nohup java -Xmx4g -XX:+UseG1GC \
  -jar /opt/aurigraph/v11/quarkus-run.jar \
  > /opt/aurigraph/v11/service.log 2>&1 &
```

**Configuration**:
- Memory: 4GB heap
- Garbage Collector: G1GC (optimized for Quarkus)
- Logging: `service.log` file
- Port: 9003

**Expected Duration**: 1-2 minutes startup

**Failure Action**: Triggers health check to verify

### Health Check Job

**Tests**:
- Waits up to 30 attempts (60 seconds)
- Calls `http://localhost:9003/q/health`
- Expects HTTP 200 with `"status":"UP"`
- Retries every 2 seconds

**Success Criteria**:
```json
{
  "status": "UP",
  "checks": [
    {"name": "Database", "status": "UP"},
    {"name": "Kafka", "status": "UP"}
  ]
}
```

**Failure Action**: Logs last 30 lines of service.log and fails

### Smoke Tests Job

**Tests Performed**:
1. ✅ Health endpoint accessible
2. ✅ Metrics endpoint responding
3. ✅ No critical errors in logs
4. ✅ Service process running

**Example Output**:
```
✅ Health endpoint OK
✅ Metrics endpoint OK
✅ No critical errors found
Smoke tests completed
```

---

## Manual Deployment

### Using Direct Script

**Command**:
```bash
./scripts/ci-cd/deploy-to-remote.sh [JAR_PATH]
```

**Example**:
```bash
./scripts/ci-cd/deploy-to-remote.sh ./target/quarkus-app/quarkus-run.jar
```

**Output**:
```
=== Aurigraph V11 Remote Deployment ===

ℹ️  Checking SSH connectivity...
✅ SSH OK
✅ JAR found: ./target/quarkus-app/quarkus-run.jar
ℹ️  Creating backup...
✅ Backup created: aurigraph-v11-backup-20251226_153000
ℹ️  Creating deployment package...
ℹ️  Uploading to remote...
ℹ️  Extracting on remote...
✅ Deployment extracted
ℹ️  Starting service...
✅ Service started
ℹ️  Running health check...
✅ Health check PASSED
✅ Smoke tests OK

✅ Deployment SUCCESSFUL
Service: https://dlt.aurigraph.io/api/v11
```

### Using GitHub CLI

**Command**:
```bash
# Trigger workflow
gh workflow run deploy-to-remote.yml \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT \
  -f environment=staging

# Monitor execution
gh run watch <RUN_ID>

# View logs
gh run view <RUN_ID> --log
```

---

## Monitoring & Logs

### View Deployment Status

**GitHub UI**:
1. Actions tab → Click "Deploy to Remote Server"
2. Select latest run
3. Click job name to see logs

**Command Line**:
```bash
# List recent deployments
gh run list --repo Aurigraph-DLT-Corp/Aurigraph-DLT \
  --workflow=deploy-to-remote.yml \
  --limit 10

# View specific deployment
gh run view <RUN_ID> --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# Stream logs
gh run watch <RUN_ID> --repo Aurigraph-DLT-Corp/Aurigraph-DLT
```

### Access Service Logs

**SSH into remote**:
```bash
ssh -p 2235 subbu@dlt.aurigraph.io
```

**View current logs**:
```bash
tail -f /opt/aurigraph/v11/service.log
```

**Check service status**:
```bash
# Is process running?
pgrep -f "quarkus-run.jar"

# Service memory usage
ps aux | grep quarkus-run.jar

# Check port
lsof -i :9003 || netstat -tlnp | grep 9003
```

### Service Health Checks

**From local machine**:
```bash
# Health endpoint
curl https://dlt.aurigraph.io/api/v11/q/health

# Metrics
curl https://dlt.aurigraph.io/api/v11/q/metrics

# Info
curl https://dlt.aurigraph.io/api/v11/info
```

**From remote server**:
```bash
ssh -p 2235 subbu@dlt.aurigraph.io
curl http://localhost:9003/q/health | jq
```

---

## Troubleshooting

### Issue: Workflow Stuck on "Quality Gates"

**Symptoms**: Workflow running but tests not starting

**Solution**:
```bash
# Check runner status
gh runner list --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# If offline, restart runner locally
cd ~/actions-runner
sudo ./svc.sh restart
```

### Issue: SSH Key Not Working

**Symptoms**: "Permission denied (publickey)" in deploy logs

**Solution**:
1. Verify SSH key in GitHub Secrets:
   ```bash
   gh secret list --repo Aurigraph-DLT-Corp/Aurigraph-DLT
   ```

2. Update SSH key:
   ```bash
   gh secret set DEPLOY_SSH_KEY --body "$(cat ~/.ssh/id_rsa)" \
     --repo Aurigraph-DLT-Corp/Aurigraph-DLT
   ```

3. Update known_hosts:
   ```bash
   gh secret set SSH_KNOWN_HOSTS \
     --body "$(ssh-keyscan -p 2235 dlt.aurigraph.io)" \
     --repo Aurigraph-DLT-Corp/Aurigraph-DLT
   ```

### Issue: Service Won't Start

**Symptoms**: Health check times out, service.log shows errors

**Solution**:
```bash
# SSH to remote
ssh -p 2235 subbu@dlt.aurigraph.io

# Check logs
tail -50 /opt/aurigraph/v11/service.log

# Check Java
java -version
free -h  # Memory available
df -h    # Disk space

# Try starting manually
cd /opt/aurigraph/v11
java -Xmx4g -XX:+UseG1GC -jar quarkus-run.jar
```

### Issue: Out of Disk Space

**Symptoms**: Deployment fails during tar extraction

**Solution**:
```bash
# SSH to remote
ssh -p 2235 subbu@dlt.aurigraph.io

# Check disk
df -h

# Clean old backups
rm -rf /opt/aurigraph/backups/aurigraph-v11-backup-{oldest}

# Clean old Docker
docker system prune -a -f

# Clean Maven cache
rm -rf ~/.m2/repository
```

### Issue: Deployment Partially Complete

**Symptoms**: Service running but reports show "failed"

**Solution**:
1. Check service health:
   ```bash
   ssh -p 2235 subbu@dlt.aurigraph.io \
     curl -s http://localhost:9003/q/health
   ```

2. If healthy, deployment was actually successful

3. Check logs for non-critical warnings

---

## Rollback Procedure

### Automatic Rollback (If Backup Available)

```bash
ssh -p 2235 subbu@dlt.aurigraph.io

# Find latest backup
ls -dt /opt/aurigraph/backups/aurigraph-v11-backup-* | head -1

# Stop service
pkill -f "quarkus-run.jar"

# Restore backup
BACKUP=$(ls -dt /opt/aurigraph/backups/aurigraph-v11-backup-* | head -1)
rm -rf /opt/aurigraph/v11/*
cp -r "$BACKUP"/* /opt/aurigraph/v11/

# Restart service
cd /opt/aurigraph/v11
nohup java -Xmx4g -XX:+UseG1GC -jar quarkus-run.jar > service.log 2>&1 &
```

### GitHub Actions Rollback

1. Find previous successful deployment run
2. Go to build artifacts
3. Download previous JAR
4. Trigger manual deployment with artifact

---

## GitHub Secrets Configuration

### Required Secrets

```bash
# SSH private key
gh secret set DEPLOY_SSH_KEY --body "$(cat ~/.ssh/id_rsa)" \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# SSH known hosts
gh secret set SSH_KNOWN_HOSTS \
  --body "$(ssh-keyscan -p 2235 dlt.aurigraph.io)" \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# GitHub token (for notifications)
gh secret set GITHUB_TOKEN --body "<YOUR_TOKEN>" \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# Codecov token (optional)
gh secret set CODECOV_TOKEN --body "<CODECOV_TOKEN>" \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT
```

### Rotate Secrets

```bash
# Every 90 days, rotate SSH key
ssh-keygen -t ed25519 -C "github-actions" -N "" \
  -f ~/.ssh/github_actions

# Update on remote
ssh -p 2235 subbu@dlt.aurigraph.io \
  'echo "$(cat ~/.ssh/github_actions.pub)" >> ~/.ssh/authorized_keys'

# Update in GitHub
gh secret set DEPLOY_SSH_KEY --body "$(cat ~/.ssh/github_actions)" \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT
```

---

## Performance Characteristics

### Build & Deploy Times

| Phase | Time | Notes |
|-------|------|-------|
| Quality Gates | 50-60 min | Full test suite, all checks |
| Build | 20-30 min | Maven clean package |
| Pre-Deployment | 2-3 min | Backup creation |
| Deployment | 2-5 min | Upload and extract |
| Service Start | 2-3 min | Java startup time |
| Health Check | 10-30 sec | Usually fast |
| Smoke Tests | 20-30 sec | Quick validation |
| **Total** | **90-120 min** | First-time deployment |

### Subsequent Deployments

- Cached Maven dependencies: -15-20 min
- Cached Docker layers: -5-10 min
- **Typical**: 70-90 minutes

---

## Best Practices

### 1. Always Test Before Deploying
```bash
# Run quality gates locally
./mvnw clean verify

# Build locally
./mvnw clean package
```

### 2. Tag Releases

```bash
# Tag build
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Workflow can reference tag
git checkout v1.0.0
./scripts/ci-cd/deploy-to-remote.sh
```

### 3. Monitor Deployments

- Set up Slack notifications
- Monitor service logs continuously
- Track error rates post-deployment
- Verify response times

### 4. Backup Before Major Changes

```bash
# Manual backup
ssh -p 2235 subbu@dlt.aurigraph.io \
  'cp -r /opt/aurigraph/v11 /opt/aurigraph/v11-backup-manual'
```

### 5. Gradual Rollout

```bash
# Deploy to staging first
gh workflow run deploy-to-remote.yml -f environment=staging

# Monitor for issues
sleep 300
curl https://dlt.aurigraph.io/api/v11/health

# Then deploy to production
gh workflow run deploy-to-remote.yml -f environment=production
```

---

## Quick Reference Commands

```bash
# Deploy latest build
git push origin main

# Manual trigger
gh workflow run deploy-to-remote.yml

# Check status
gh run list --workflow=deploy-to-remote.yml --limit 5

# View latest logs
gh run view --repo Aurigraph-DLT-Corp/Aurigraph-DLT | head -50

# Check runner
gh runner list --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# SSH to remote
ssh -p 2235 subbu@dlt.aurigraph.io

# Check service
ssh -p 2235 subbu@dlt.aurigraph.io 'pgrep -f quarkus-run.jar'

# View logs
ssh -p 2235 subbu@dlt.aurigraph.io 'tail -50 /opt/aurigraph/v11/service.log'

# Health check
curl https://dlt.aurigraph.io/api/v11/q/health
```

---

## Support & Documentation

- **GitHub Actions**: https://docs.github.com/en/actions
- **Self-Hosted Runners**: https://docs.github.com/en/actions/hosting-your-own-runners
- **Workflow Syntax**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT

---

**Status**: ✅ Ready for Production
**Last Updated**: December 26, 2025
**Maintained By**: Platform Team
