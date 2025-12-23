# Aurigraph V11 Remote Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying Aurigraph V11 to the remote server at `dlt.aurigraph.io`.

**Target**: `dlt.aurigraph.io` (SSH port 2235)
**User**: `subbu`
**Deployment Method**: Automated via GitHub Actions or manual script

---

## 📋 Quick Start

### Option 1: Manual Deployment Script (Recommended for Testing)

```bash
# From repository root
bash scripts/ci-cd/deploy-to-remote.sh
```

**What it does**:
1. Builds V11 JAR with Maven
2. Creates backup of current deployment
3. Pulls latest code on remote
4. Updates Docker images
5. Deploys services via docker-compose
6. Runs health checks
7. Verifies deployment

**Duration**: 15-25 minutes

### Option 2: Automated GitHub Actions Workflow

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Select: "Remote Server CI/CD Deployment"
3. Click: "Run workflow"
4. Choose options:
   - Deployment target: `production`
   - Deployment strategy: `blue-green`
   - Skip tests: `false` (or `true` for faster deployment)
5. Click "Run workflow"

**Duration**: 15-25 minutes

### Option 3: Automatic on Push

Push to `main` branch to trigger automatic production deployment:

```bash
git commit -m "feat: Your changes"
git push origin main
# Workflow automatically triggers
```

---

## 🔐 Prerequisites

### For Manual Deployment Script

✅ **GitHub CLI** - Installed and authenticated
```bash
gh auth status  # Should show authenticated
```

✅ **Java 21** - For building V11
```bash
java --version  # Should show Java 21+
```

✅ **Maven** - For building
```bash
mvn --version  # Should show Maven 3.9+
```

✅ **SSH Access** - To remote server
```bash
# Should connect without errors
ssh -p 2235 subbu@dlt.aurigraph.io "echo SSH OK"
```

✅ **Docker** - For local image building (optional)
```bash
docker --version
```

### For GitHub Actions Workflow

✅ **GitHub Secrets Configured**:
- `SERVER_HOST` - `dlt.aurigraph.io`
- `SERVER_USERNAME` - `subbu`
- `SERVER_PORT` - `2235`
- `SERVER_SSH_PRIVATE_KEY` - SSH private key
- `JIRA_API_TOKEN` - For integrations

Check secrets:
```bash
gh secret list
```

---

## 📊 Deployment Steps (Manual Script)

### Step 1: Run Deployment Script

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
bash scripts/ci-cd/deploy-to-remote.sh
```

### Step 2: Monitor Output

The script will display:
- Build progress
- Deployment steps
- Health checks
- Summary with access points

### Step 3: Verify Deployment

```bash
# Check if services are running
ssh -p 2235 subbu@dlt.aurigraph.io "docker ps"

# Test API endpoint
curl https://dlt.aurigraph.io/api/v11/health

# Test Portal
curl https://dlt.aurigraph.io
```

### Step 4: Monitor in Browser

Open: https://dlt.aurigraph.io

---

## 🔄 Deployment Strategies

### Blue-Green (Default - Recommended)

**Zero-downtime deployment**:
1. New version (green) deployed alongside current (blue)
2. Health checks run on green
3. Traffic switches when healthy
4. Old version (blue) kept as instant rollback

**Advantages**:
- Zero downtime
- Instant rollback
- Low risk
- Easy testing

**Best for**: Production environments

### Canary

**Gradual rollout**:
1. Deploy to 5% of traffic
2. Monitor error rates
3. Gradually increase traffic percentage
4. Automatic rollback if errors

**Advantages**:
- Tests with real traffic
- Gradual rollout
- Early detection of issues

**Best for**: Testing in production

### Rolling

**One instance at a time**:
1. Update instance 1
2. Health check
3. Move to instance 2
4. Continue until all updated

**Advantages**:
- No downtime
- Steady state

**Best for**: Large clusters

---

## 🎯 Deployment Phases

### Phase 1: Build (8-10 minutes)
```
✓ Checkout code
✓ Verify Java 21
✓ Build V11 JAR with Maven
✓ Create Docker image
✓ Push to registry (GitHub Actions only)
```

### Phase 2: Remote Deployment (2-5 minutes)
```
✓ SSH to remote server
✓ Create pre-deployment backup
✓ Pull latest code
✓ Update Docker images
✓ Start services with docker-compose
✓ Wait for stabilization
```

### Phase 3: Verification (1-2 minutes)
```
✓ Run health checks
✓ Verify API endpoints
✓ Verify portal access
✓ Check database connectivity
✓ Display container status
```

### Phase 4: Monitoring (5 minutes in CI/CD)
```
✓ Continuous health checks
✓ Error rate monitoring
✓ Performance metrics
✓ Service availability checks
```

---

## ✅ Verification Checklist

After deployment, verify:

### Remote Server Status
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
docker ps --format "table {{.Names}}\t{{.Status}}"
EOF
```

Expected containers:
- `traefik` - Reverse proxy
- `postgres` - Database
- `redis` - Cache
- `aurigraph-v11` - Main service
- `enterprise-portal` - Web UI

### API Endpoints
```bash
# Health check
curl https://dlt.aurigraph.io/api/v11/health

# System info
curl https://dlt.aurigraph.io/api/v11/info

# Metrics
curl https://dlt.aurigraph.io/metrics
```

### Portal Access
```bash
# Should return HTML
curl https://dlt.aurigraph.io -L | head -20
```

### Database Connectivity
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
docker exec -it postgres psql -U aurigraph -d aurigraph_production -c "SELECT version();"
EOF
```

---

## 🔄 Rollback Procedure

### Automatic Rollback (on failure)

If deployment fails:
1. Health checks fail
2. Backup is located
3. Database restored from backup
4. Services restarted
5. Previous version running

### Manual Rollback

```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
cd /opt/aurigraph/backups

# Find latest backup
BACKUP=$(ls -t pre-deploy-* | head -1)

# Restore database
zcat $BACKUP/aurigraph-db.sql.gz | \
  docker exec -i postgres \
  psql -U aurigraph aurigraph_production

# Restart services
cd /opt/aurigraph/production
docker-compose restart

# Verify
curl http://localhost:9003/q/health
EOF
```

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Build time | 8-10 min |
| Docker push | 2-3 min |
| Remote deployment | 2-5 min |
| Health checks | 1-2 min |
| Total time | 15-25 min |
| Deployment downtime | 0 seconds (blue-green) |
| Rollback time | < 1 second |

---

## 🧪 Testing Deployment

### Test 1: Check Build
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests
```

### Test 2: Check Docker Build
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
docker build -t aurigraph-v11:test .
```

### Test 3: Check SSH Access
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "docker --version"
```

### Test 4: Dry Run (no actual deploy)
```bash
# Review the deployment script
cat scripts/ci-cd/deploy-to-remote.sh

# Check what would be deployed
git log --oneline -5
git diff origin/main
```

---

## 🚨 Troubleshooting

### SSH Connection Failed
```bash
# Verify host is reachable
ping dlt.aurigraph.io

# Check SSH with verbose
ssh -v -p 2235 subbu@dlt.aurigraph.io

# Verify key
ls -la ~/.ssh/
```

### Build Fails
```bash
# Check Java version
java --version

# Check Maven
mvn --version

# Clean rebuild
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean compile
```

### Deployment Hangs
```bash
# Check remote server
ssh -p 2235 subbu@dlt.aurigraph.io "docker ps"
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs aurigraph-v11 | tail -50"
```

### Health Checks Fail
```bash
# Check logs
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
docker logs postgres
docker logs redis
docker logs traefik
docker logs aurigraph-v11
EOF

# Manually check health
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
curl -v http://localhost:9003/q/health
curl -v http://localhost:3000
EOF
```

---

## 📞 Monitoring Deployment

### Real-time Logs (GitHub Actions)
1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Select workflow run
3. Expand each job for logs

### Remote Server Logs
```bash
# Live logs
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs -f aurigraph-v11"

# Historical logs
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs aurigraph-v11 | tail -100"
```

### System Metrics
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
echo "Memory:"
free -h

echo ""
echo "Disk:"
df -h

echo ""
echo "Load:"
uptime
EOF
```

---

## 📚 Related Documentation

- **CI/CD Setup**: `docs/cicd/REMOTE_DEPLOYMENT_SETUP.md`
- **CI/CD Overview**: `docs/cicd/README.md`
- **GitHub Actions Workflow**: `.github/workflows/remote-deployment.yml`
- **Deployment Script**: `scripts/ci-cd/deploy-to-remote.sh`
- **Manual Setup Script**: `scripts/ci-cd/setup-remote-deployment.sh`

---

## ✅ Pre-Deployment Checklist

Before deploying:

- [ ] Code committed and pushed
- [ ] All tests passing locally
- [ ] No uncommitted changes
- [ ] SSH access verified
- [ ] GitHub Secrets configured
- [ ] Backups exist on remote server
- [ ] Java 21 installed
- [ ] Maven available
- [ ] Docker CLI available
- [ ] Read deployment strategy above

---

## 🎯 Next Steps

1. **Verify Prerequisites**:
   ```bash
   java --version
   mvn --version
   ssh -p 2235 subbu@dlt.aurigraph.io "echo Connected"
   ```

2. **Run Deployment**:
   ```bash
   bash scripts/ci-cd/deploy-to-remote.sh
   ```

3. **Monitor Deployment**:
   - Watch console output
   - Check remote server
   - Verify endpoints

4. **Verify Success**:
   ```bash
   curl https://dlt.aurigraph.io/api/v11/health
   ```

---

## 📝 Deployment Log Example

```
✓ Git repository verified
✓ Working directory clean
✓ Latest commit: abc1234 (v11.0.0)
✓ V11 JAR built successfully
✓ Remote deployment completed
✓ Container status verified
✓ API endpoints responding

✓ Deployment completed successfully!

Access Points:
  API: https://dlt.aurigraph.io/api/v11
  Portal: https://dlt.aurigraph.io
  Health: https://dlt.aurigraph.io/q/health
```

---

**Ready to deploy Aurigraph V11!** 🚀
