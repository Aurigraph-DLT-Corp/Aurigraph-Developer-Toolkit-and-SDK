# GitHub Secrets Setup for V12 Deployment

> **Version**: 1.0.0 | **Last Updated**: November 28, 2025

This document describes the GitHub Secrets required for automated CI/CD deployment of Aurigraph V12 to the remote server.

---

## Required Secrets

### 1. SERVER_SSH_PRIVATE_KEY (Required) - Already Configured

**Purpose**: SSH private key for authentication to dlt.aurigraph.io

**Status**: Already configured in GitHub Secrets (since 2025-09-22)

**If you need to update**:
1. Generate an SSH key pair:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-deploy-key
   ```

2. Add the public key to the remote server:
   ```bash
   ssh subbu@dlt.aurigraph.io "cat >> ~/.ssh/authorized_keys" < ~/.ssh/github-deploy-key.pub
   ```

3. Update in GitHub Secrets:
   - Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/secrets/actions
   - Update: `SERVER_SSH_PRIVATE_KEY`
   - Value: Contents of `~/.ssh/github-deploy-key` (private key)

**Related Secrets** (also already configured):
- `SERVER_HOST` - dlt.aurigraph.io
- `SERVER_PORT` - 2235
- `SERVER_USERNAME` - subbu

### 2. SLACK_WEBHOOK_URL (Optional)

**Purpose**: Slack notifications for deployment status

**Setup Steps**:
1. Go to your Slack workspace settings
2. Create an incoming webhook: https://api.slack.com/messaging/webhooks
3. Add to GitHub Secrets:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

---

## Server Configuration

| Property | Value |
|----------|-------|
| **Host** | dlt.aurigraph.io |
| **SSH Port** | 22 |
| **Username** | subbu |
| **App Directory** | /home/subbu |
| **App Port** | 9003 |
| **gRPC Port** | 9004 |

---

## Workflow File

The deployment workflow is located at:
```
.github/workflows/v12-deploy-remote.yml
```

### Triggers

1. **Push to V12 or main branch** (path-filtered):
   - `aurigraph-av10-7/aurigraph-v11-standalone/src/**`
   - `aurigraph-av10-7/aurigraph-v11-standalone/pom.xml`

2. **Manual dispatch** with options:
   - Environment: production/staging
   - Skip tests: true/false
   - Force deploy: true/false

---

## Testing the Setup

### 1. Verify SSH Access

```bash
# Test SSH connection
ssh -p 2235 -o BatchMode=yes subbu@dlt.aurigraph.io "echo 'SSH works'"
```

### 2. Check GitHub Secrets

```bash
# List secrets (requires gh CLI)
gh secret list --repo Aurigraph-DLT-Corp/Aurigraph-DLT
```

### 3. Manual Workflow Trigger

1. Go to Actions tab in GitHub
2. Select "V12 Remote Server Deployment"
3. Click "Run workflow"
4. Choose options and run

---

## Deployment Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    V12 Deployment Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  BUILD   │───▶│  UPLOAD  │───▶│  DEPLOY  │───▶│  VERIFY  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  Maven build     SCP JAR to     Stop old app    Health check   │
│  Skip tests      remote server  Start new app   API endpoints  │
│  Create JAR      /home/subbu    Wait 15s                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phases

1. **Build Phase**
   - Checkout code
   - Setup Java 21
   - Build JAR with Maven
   - Upload artifact

2. **Deploy Phase**
   - Download artifact
   - Setup SSH connection
   - Create backup
   - Upload new JAR
   - Stop old process
   - Start new process
   - Health check (12 retries, 10s interval)

3. **Post-Deploy Phase**
   - Verify endpoints
   - Create summary
   - Send notifications

---

## Rollback

The workflow includes automatic rollback on health check failure:

1. Stops the failed deployment
2. Restores the previous JAR (`aurigraph-v12.jar.previous`)
3. Starts the previous version
4. If no previous version, tries latest backup

### Manual Rollback

```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
cd /home/subbu

# Stop current
pkill -f 'aurigraph-v12.jar'

# Restore previous
mv aurigraph-v12.jar aurigraph-v12.jar.failed
mv aurigraph-v12.jar.previous aurigraph-v12.jar

# Or restore from backup
# cp aurigraph-v12.jar.backup-YYYYMMDD_HHMMSS aurigraph-v12.jar

# Start
nohup java -Xmx8g -Xms4g -XX:+UseG1GC \
  -Dquarkus.http.port=9003 \
  -jar aurigraph-v12.jar > logs/v12.log 2>&1 &
EOF
```

---

## Troubleshooting

### SSH Connection Failed

```bash
# Check if key is added
ssh-add -l

# Test with verbose output
ssh -v -p 2235 subbu@dlt.aurigraph.io

# Ensure known_hosts has the server
ssh-keyscan -p 2235 dlt.aurigraph.io >> ~/.ssh/known_hosts
```

### Health Check Failed

```bash
# Check logs on server
ssh -p 2235 subbu@dlt.aurigraph.io "tail -100 /home/subbu/logs/v12.log"

# Check if process is running
ssh -p 2235 subbu@dlt.aurigraph.io "ps aux | grep aurigraph"

# Manual health check
ssh -p 2235 subbu@dlt.aurigraph.io "curl -v http://localhost:9003/api/v11/health"
```

### Build Failed

```bash
# Run build locally first
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests

# Check for compilation errors
./mvnw compile 2>&1 | tail -50
```

---

## Security Notes

1. **Never commit secrets** to the repository
2. **Rotate SSH keys** periodically (recommended: 90 days)
3. **Use deploy keys** with minimal permissions
4. **Audit access** to GitHub secrets regularly
5. **Enable branch protection** for main/V12 branches

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [CI/CD Remote Deployment Summary](./CI_CD_REMOTE_DEPLOYMENT_SUMMARY.md)
- [Developer Handbook](../DEVELOPER_HANDBOOK.md)

---

*Last Updated: November 28, 2025*
