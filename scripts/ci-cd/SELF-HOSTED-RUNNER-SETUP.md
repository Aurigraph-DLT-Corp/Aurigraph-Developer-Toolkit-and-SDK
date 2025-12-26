# Self-Hosted GitHub Actions Runner Setup
**Aurigraph DLT V11 - CI/CD Infrastructure**

---

## Overview

This guide sets up a self-hosted GitHub Actions runner on your macOS development machine and remote server for executing CI/CD workflows.

**Benefits**:
- ✅ Faster builds (no GitHub queue)
- ✅ Full control over runner environment
- ✅ Private network deployments
- ✅ Custom tool installations
- ✅ Cost-effective for frequent builds

---

## Prerequisites

### Local Runner (macOS)
- macOS 11+ or Ubuntu 20.04+
- Git installed
- Java 21 installed
- Docker Desktop running
- ~10GB free disk space for Maven cache

### Remote Server (dlt.aurigraph.io)
- SSH access with key-based authentication
- Java 21 installed
- Maven 3.9+ installed
- Docker installed and running
- ~20GB free disk space

---

## Part 1: Local Runner Setup (macOS)

### Step 1: Create runner directory
```bash
# Create directory for runner
mkdir -p ~/actions-runner
cd ~/actions-runner
```

### Step 2: Download GitHub Actions Runner
```bash
# Visit https://github.com/actions/runner/releases
# Download the latest release for macOS

# For Apple Silicon (M1/M2/M3):
curl -o actions-runner-osx-arm64.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz

# For Intel:
curl -o actions-runner-osx-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz

# Extract
tar xzf actions-runner-osx-*.tar.gz
```

### Step 3: Register the runner with GitHub

**Get registration token**:
1. Go to GitHub repo: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
2. Settings → Actions → Runners
3. Click "New self-hosted runner"
4. Copy the registration token

**Register**:
```bash
cd ~/actions-runner

# Configure
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
  --token <REGISTRATION_TOKEN> \
  --name "macos-local" \
  --runnergroup "Default" \
  --labels "self-hosted,macos,x64" \
  --work ./_work
```

When prompted:
- Default runner group: ✅ Press Enter
- Work folder: ✅ Press Enter (uses `_work`)
- Add labels: `self-hosted,macos,x64`

### Step 4: Install as service (macOS)
```bash
# Install service
cd ~/actions-runner
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### Step 5: Verify runner is online
1. Go to GitHub repo → Settings → Actions → Runners
2. You should see "macos-local" listed as **Idle** (green dot)

---

## Part 2: Remote Server Runner Setup

### Step 1: SSH into remote server
```bash
ssh -p 2235 subbu@dlt.aurigraph.io
```

### Step 2: Create runner directory
```bash
# Create dedicated user for runner (optional but recommended)
sudo useradd -m -s /bin/bash runner || echo "User exists"
sudo mkdir -p /opt/actions-runner
sudo chown runner:runner /opt/actions-runner

# Switch to runner user
sudo -u runner -s
cd /opt/actions-runner
```

### Step 3: Download and extract runner
```bash
# Get latest runner release
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

tar xzf actions-runner-linux-x64.tar.gz

# Verify
ls -la
```

### Step 4: Configure runner
```bash
# Get registration token from GitHub (same as local)

./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
  --token <REGISTRATION_TOKEN> \
  --name "remote-dlt-aurigraph" \
  --runnergroup "Default" \
  --labels "self-hosted,linux,remote" \
  --work ./_work \
  --replace
```

### Step 5: Install as systemd service (Linux)
```bash
# Install service
sudo /opt/actions-runner/svc.sh install

# Start service
sudo /opt/actions-runner/svc.sh start

# Check status
sudo /opt/actions-runner/svc.sh status

# View logs
sudo journalctl -u actions.runner -f
```

---

## Part 3: Runner Configuration

### Environment Setup

Create `~/actions-runner/.env` (local) or `/opt/actions-runner/.env` (remote):

```bash
# Java
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64  # Linux
export JAVA_HOME=/opt/homebrew/opt/openjdk@21       # macOS

# Maven
export MAVEN_OPTS="-Xmx8g -XX:+UseG1GC"

# Docker
export DOCKER_BUILDKIT=1

# GitHub
export GITHUB_TOKEN=<your-token>
```

### GitHub Secrets Setup

Store deployment credentials in GitHub Secrets:

1. Go to repo → Settings → Secrets and variables → Actions
2. Create new secrets:

```
DEPLOY_SSH_KEY: <your-private-ssh-key>
SSH_KNOWN_HOSTS: <ssh-keyscan output>
CODECOV_TOKEN: <codecov-token>
```

**Get SSH key and known_hosts**:
```bash
# Export private SSH key
cat ~/.ssh/id_rsa  # Copy output to DEPLOY_SSH_KEY

# Get SSH known hosts entry
ssh-keyscan -p 2235 dlt.aurigraph.io  # Copy to SSH_KNOWN_HOSTS
```

---

## Part 4: Monitoring & Maintenance

### Check Runner Status

**GitHub UI**:
- Settings → Actions → Runners
- Look for green dot = Online, gray = Offline

**Command line** (macOS):
```bash
# Check service status
sudo ./svc.sh status

# View logs
log stream --predicate 'process == "Runner.Listener"' --level debug
```

**Command line** (Linux):
```bash
# Check service status
sudo /opt/actions-runner/svc.sh status

# View logs
sudo journalctl -u actions.runner -f -n 100
```

### Upgrade Runner

```bash
# Stop service
sudo ./svc.sh stop

# Download new version
curl -o actions-runner-osx-*.tar.gz -L \
  https://github.com/actions/runner/releases/download/v<NEW_VERSION>/...

# Extract over existing
tar xzf actions-runner-osx-*.tar.gz --overwrite

# Start service
sudo ./svc.sh start

# Verify
sudo ./svc.sh status
```

### Restart Runner

**macOS**:
```bash
sudo ./svc.sh restart
```

**Linux**:
```bash
sudo systemctl restart actions.runner
```

---

## Part 5: Runner Troubleshooting

### Problem: Runner is Offline

**Check if service is running**:
```bash
# macOS
sudo ./svc.sh status

# Linux
sudo /opt/actions-runner/svc.sh status
sudo systemctl is-active actions.runner
```

**Restart service**:
```bash
# macOS
sudo ./svc.sh restart

# Linux
sudo systemctl restart actions.runner
```

**View logs**:
```bash
# macOS
log stream --predicate 'process == "Runner.Listener"'

# Linux
sudo journalctl -u actions.runner -f
```

### Problem: Workflow fails with permission errors

**Check docker permissions** (Linux):
```bash
# Add runner user to docker group
sudo usermod -aG docker runner

# Verify
docker ps
```

**SSH key permissions**:
```bash
# SSH private key must be 600
chmod 600 ~/.ssh/id_rsa
```

### Problem: Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a -f

# Clean Maven cache
rm -rf ~/.m2/repository

# Clean runner work directory
rm -rf ~/actions-runner/_work/*
```

### Problem: Network timeout during deployment

**Check SSH connectivity**:
```bash
ssh -p 2235 subbu@dlt.aurigraph.io 'echo OK'
```

**Check GitHub API**:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user
```

---

## Part 6: Workflow Execution

### View running workflows

**GitHub UI**:
- Actions tab → Click workflow name

**Command line**:
```bash
# List recent workflow runs
gh run list --repo Aurigraph-DLT-Corp/Aurigraph-DLT --limit 10

# View specific run
gh run view <RUN_ID> --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# View logs
gh run view <RUN_ID> --repo Aurigraph-DLT-Corp/Aurigraph-DLT --log
```

### Trigger workflow manually

**GitHub UI**:
- Actions tab → Select workflow → "Run workflow" button

**Command line**:
```bash
gh workflow run deploy-to-remote.yml \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT \
  -f environment=staging
```

---

## Part 7: Security Best Practices

### 1. SSH Key Management
```bash
# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Add to authorized_keys on remote
cat ~/.ssh/github_actions.pub | ssh -p 2235 subbu@dlt.aurigraph.io \
  'cat >> ~/.ssh/authorized_keys'

# Set proper permissions
chmod 600 ~/.ssh/github_actions
chmod 600 ~/.ssh/authorized_keys
```

### 2. GitHub Token Rotation
```bash
# Generate new personal access token
# GitHub Settings → Developer settings → Personal access tokens

# Update in GitHub Secrets
gh secret set GITHUB_TOKEN --body "<NEW_TOKEN>" \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT
```

### 3. Secrets Audit
```bash
# List all secrets (names only)
gh secret list --repo Aurigraph-DLT-Corp/Aurigraph-DLT
```

### 4. Access Control
```bash
# Limit runner to specific workflows
# In workflow file, specify:
# runs-on: self-hosted
# (Only runs on self-hosted runners)
```

---

## Deployment Workflow Architecture

```
GitHub Push (main branch)
    ↓
[Quality Gates Job]
  - Run Maven tests
  - Check code coverage
  - Verify JaCoCo gates
    ↓
[Build Job]
  - Maven clean package
  - Create JAR artifact
  - Upload to GitHub
    ↓
[Pre-Deployment Job]
  - SSH to remote
  - Backup current version
    ↓
[Deployment Job]
  - Download artifact
  - Upload via SCP
  - Extract on remote
    ↓
[Start Service Job]
  - Stop old service
  - Start new service
    ↓
[Health Check Job]
  - Verify HTTP endpoints
  - Check service logs
    ↓
[Summary Job]
  - Report status
  - Post to GitHub
```

---

## Quick Commands Reference

```bash
# View runner status
~/actions-runner/config.sh --check

# Remove runner (when decommissioning)
./config.sh remove --token <REMOVAL_TOKEN>

# Uninstall service
sudo ./svc.sh uninstall

# View all runners
gh runner list --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# Trigger test workflow
gh workflow run test-quality-gates.yml \
  --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# View deployment logs
gh run view <RUN_ID> --repo Aurigraph-DLT-Corp/Aurigraph-DLT \
  --log --job deploy
```

---

## Support & Documentation

- **GitHub Actions Runner**: https://github.com/actions/runner
- **Workflow Syntax**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **Self-Hosted Runners**: https://docs.github.com/en/actions/hosting-your-own-runners
- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT

---

**Status**: ✅ Ready for Production Deployment
**Last Updated**: December 26, 2025
**Maintained By**: Platform Team
