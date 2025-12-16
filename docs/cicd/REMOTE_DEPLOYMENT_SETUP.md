# Remote Server CI/CD Deployment Setup Guide

## Overview

This guide walks through setting up automated CI/CD deployment to your remote Aurigraph server at `dlt.aurigraph.io`.

**Status**: Ready for configuration
**Deployment Strategy**: Blue-Green with automatic health checks and rollback
**Monitoring**: 5-minute post-deployment monitoring

---

## Prerequisites

Before starting, ensure you have:

1. **SSH Access to Remote Server**
   ```bash
   ssh -p 22 subbu@dlt.aurigraph.io
   ```

2. **GitHub Repository Access**
   - You must have push access to the repository
   - Repository: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT

3. **Required Tools Installed Locally**
   - `git` command line
   - `ssh-keygen` (for creating SSH keys)
   - Basic Unix utilities

---

## Step 1: Generate SSH Deployment Key

If you don't have a dedicated deployment SSH key:

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -f ~/.ssh/aurigraph-deploy-key -N ""

# Display the private key (for GitHub Secrets)
cat ~/.ssh/aurigraph-deploy-key
```

**Important**:
- Save the entire private key content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- The public key should be added to the remote server's `~/.ssh/authorized_keys`

---

## Step 2: Configure Remote Server SSH Access

Connect to your remote server and add the public key:

```bash
# On your local machine
ssh -p 22 subbu@dlt.aurigraph.io

# Once connected, add the public key
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify SSH login works without password
exit
ssh -p 22 subbu@dlt.aurigraph.io "echo SSH key works"
```

---

## Step 3: Add GitHub Secrets

Navigate to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/secrets/actions

### Required Secrets for Production Deployment

Add the following secrets:

#### 1. Production Deployment Secrets

**`PROD_SSH_KEY`**
- **Value**: Private SSH key content (the entire file including BEGIN/END lines)
- **Used For**: SSH authentication to production server
- **Location**: Repository Settings → Secrets

**`PROD_HOST`**
- **Value**: `dlt.aurigraph.io`
- **Purpose**: Production server hostname

**`PROD_USER`**
- **Value**: `subbu`
- **Purpose**: SSH username for production server

#### 2. Staging Deployment Secrets (Optional)

**`STAGING_SSH_KEY`**
- **Value**: Private SSH key for staging (if different from production)
- **Optional**: Can reuse PROD_SSH_KEY if same credentials

**`STAGING_HOST`**
- **Value**: Staging server hostname or IP
- **Optional**: Default uses production if not set

**`STAGING_USER`**
- **Value**: SSH username for staging
- **Optional**: Default is `subbu`

#### 3. Notification Secrets

**`SLACK_WEBHOOK_URL`**
- **Value**: Slack webhook URL for deployment notifications
- **Purpose**: Send deployment status updates to Slack
- **How to Create**:
  1. Go to https://api.slack.com/messaging/webhooks
  2. Create new Incoming Webhook for your workspace
  3. Copy the webhook URL

### Quick Setup Command

```bash
# Set production secrets using GitHub CLI
gh secret set PROD_SSH_KEY < ~/.ssh/aurigraph-deploy-key
gh secret set PROD_HOST -b "dlt.aurigraph.io"
gh secret set PROD_USER -b "subbu"
gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

---

## Step 4: Verify Secrets Are Configured

Check that all secrets are set:

```bash
gh secret list
```

You should see:
```
PROD_HOST          Updated ....
PROD_SSH_KEY       Updated ....
PROD_USER          Updated ....
SLACK_WEBHOOK_URL  Updated ....
```

---

## Step 5: Remote Server Configuration

Ensure the remote server has:

### Directory Structure
```bash
/opt/aurigraph/
├── production/          # Main production deployment
│   ├── docker-compose.yml
│   └── configs/
├── staging/             # Staging deployment
├── backups/             # Backup directory
└── config/              # Configuration files
```

### Create remote directories
```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'EOF'
mkdir -p /opt/aurigraph/{production,staging,backups}
cd /opt/aurigraph/production
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git .
EOF
```

### Docker & Docker Compose Installation
```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'EOF'
# Verify Docker is installed
docker --version
docker-compose --version

# Or install if needed
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
EOF
```

---

## Step 6: Test CI/CD Pipeline

### Manual Trigger Test

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Click "Remote Server CI/CD Deployment" workflow
3. Click "Run workflow"
4. Select:
   - **Deployment target**: `staging` (for first test)
   - **Deployment strategy**: `blue-green`
   - **Skip tests**: ✓ (for faster initial test)
5. Click "Run workflow"

### Monitor Execution

The workflow will:
1. ✅ Validate configuration
2. ✅ Build V11 Docker image
3. ✅ Push to GitHub Container Registry
4. ✅ Deploy to remote server
5. ✅ Run health checks
6. ✅ Send Slack notification

**Expected Duration**: 15-25 minutes

---

## Step 7: Verify Deployment

After the workflow completes, verify:

### Remote Server Status
```bash
ssh -p 22 subbu@dlt.aurigraph.io "docker ps"
```

You should see running containers:
- `traefik` (reverse proxy)
- `postgres` (database)
- `redis` (cache)
- `aurigraph-v11` (main service)
- `enterprise-portal` (web UI)

### API Endpoints
```bash
# Health check
curl https://dlt.aurigraph.io/api/v11/health

# API info
curl https://dlt.aurigraph.io/api/v11/info

# Metrics
curl https://dlt.aurigraph.io/metrics
```

### Enterprise Portal
Open in browser: https://dlt.aurigraph.io

---

## Deployment Strategies

### Blue-Green (Recommended)
- **Zero downtime** deployment
- New version (green) deployed alongside current (blue)
- Traffic switched after health checks pass
- Old version remains as instant rollback
- **Best for**: Production, critical services

### Canary
- **5% traffic** sent to new version initially
- Monitor error rates
- Gradually increase traffic percentage
- **Best for**: Testing new features in production

### Rolling
- **One instance at a time** deployment
- No downtime, gradual rollout
- **Best for**: Large clusters

---

## Monitoring & Alerts

### Slack Notifications
- ✅ Deployment success → Green message
- ❌ Deployment failure → Red message with rollback info
- 📊 Metrics updates

### Health Checks
The pipeline automatically verifies:
- API endpoint responds: `/api/v11/health`
- Portal accessible: `/`
- Metrics endpoint: `/metrics`
- Database connectivity
- Container health

### Post-Deployment Monitoring
After deployment, the system monitors for 5 minutes:
- Service availability
- Error rates
- Response times
- Container health

---

## Troubleshooting

### SSH Connection Failed
```bash
# Verify SSH key is loaded
ssh-add ~/.ssh/aurigraph-deploy-key

# Test connection manually
ssh -p 22 -v subbu@dlt.aurigraph.io
```

### Deployment Timeout
- Increase timeout in workflow file
- Check remote server resources
- Verify Docker daemon is running

### Health Check Failed
```bash
# Check remote service logs
ssh -p 22 subbu@dlt.aurigraph.io "docker logs aurigraph-v11"
ssh -p 22 subbu@dlt.aurigraph.io "docker logs postgres"
```

### Port Conflicts
```bash
# Check ports on remote server
ssh -p 22 subbu@dlt.aurigraph.io "netstat -tlnp | grep -E '9003|9004|3000|80|443'"

# Kill conflicting process if needed
ssh -p 22 subbu@dlt.aurigraph.io "lsof -i :9003 && kill -9 <PID>"
```

### Docker Image Not Found
```bash
# Verify image was pushed
docker images | grep aurigraph

# Manually pull on remote
ssh -p 22 subbu@dlt.aurigraph.io "docker pull ghcr.io/aurigraph-dlt-corp/aurigraph-dlt/aurigraph-v11:latest"
```

---

## Rollback Procedure

If deployment fails, automatic rollback is initiated:

### Automatic Rollback
1. Health checks fail
2. Previous backup is located
3. Database restored from backup
4. Previous version restarted
5. Notification sent to Slack

### Manual Rollback
```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'EOF'
cd /opt/aurigraph/production

# Get latest backup
BACKUP=$(ls -t /opt/aurigraph/backups/pre-deploy-* | head -1)

# Restore database
zcat $BACKUP/aurigraph-db.sql.gz | docker exec -i dlt-postgres psql -U aurigraph aurigraph_production

# Restart services
docker-compose restart

# Verify health
curl http://localhost:9003/q/health
EOF
```

---

## Performance Tuning

### GitHub Actions Runner
- Jobs run on `ubuntu-latest`
- 4 CPU cores, 16GB RAM
- Build time: ~10 minutes

### Deployment Time
- Build: 8-10 min
- Docker push: 2-3 min
- Remote deployment: 2-5 min
- Health checks: 1-2 min
- **Total**: 15-25 minutes

### To Speed Up:
1. Skip tests for non-main branches
2. Use GitHub Actions cache
3. Use native container builds
4. Reduce health check timeouts

---

## Security Best Practices

✅ **Do:**
- Rotate SSH keys every 90 days
- Use strong SSH key passphrases locally
- Limit Slack webhook to specific channel
- Review logs regularly
- Use environment variables for secrets

❌ **Don't:**
- Commit private keys to repository
- Hardcode credentials in workflow files
- Share SSH keys via email
- Use same key for multiple services
- Leave SSH keys accessible

---

## Next Steps

1. **Add secrets** to GitHub (Step 3)
2. **Configure remote server** (Step 5)
3. **Test deployment** with staging (Step 6)
4. **Verify deployment** (Step 7)
5. **Set up monitoring** (Slack alerts)
6. **Enable automatic deployment** on `main` branch push

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Guide](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [SSH Key Management](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

## Support

For issues or questions:
1. Check deployment logs: Actions → Workflow run → View logs
2. Check remote server: `ssh -p 22 subbu@dlt.aurigraph.io`
3. Check containers: `docker ps -a`
4. View logs: `docker logs <container-name>`

---

## Checklist

- [ ] SSH deployment key generated
- [ ] Public key added to remote server
- [ ] GitHub secrets configured (PROD_SSH_KEY, PROD_HOST, PROD_USER)
- [ ] SSH connection verified
- [ ] Remote directories created
- [ ] Docker installed on remote server
- [ ] Test deployment executed successfully
- [ ] Health checks passing
- [ ] Slack notifications configured
- [ ] Documentation reviewed

✅ **Ready for production deployment!**
