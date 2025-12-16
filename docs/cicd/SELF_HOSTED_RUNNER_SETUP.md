# Self-Hosted Runner CI/CD Setup Guide

## Overview

This guide explains how to set up GitHub Actions self-hosted runner for deploying Aurigraph V12 to the remote server (dlt.aurigraph.io).

### Why Self-Hosted Runners?

| Feature | GitHub-Hosted | Self-Hosted |
|---------|---------------|-------------|
| SSH Keys Required | Yes | No |
| Artifact Transfer | Via GitHub Storage | Direct Filesystem |
| Network Speed | Internet | Local |
| Build Caching | Limited | Full Local |
| Service Control | Via SSH | Direct systemd |
| Security | Requires Secrets | Native Access |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                                │
│                    (Aurigraph-DLT-Corp/Aurigraph-DLT)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                         Push to V12/main                                │
│                              │                                          │
│                              ▼                                          │
│                    GitHub Actions Workflow                              │
│                    (self-hosted-cicd.yml)                              │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ Triggers
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Self-Hosted Runner                                   │
│                   (dlt.aurigraph.io)                                   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                   GitHub Actions Runner                           │ │
│  │  Location: /home/subbu/actions-runner                            │ │
│  │  Labels: self-hosted, Linux, aurigraph-prod                      │ │
│  │  Service: actions.runner.aurigraph-prod-runner                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                               │                                         │
│                               ▼                                         │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │   Build Backend    │  │   Build Frontend   │  │    Deploy        │  │
│  │   (Maven/Java 21)  │  │   (Node.js 20)    │  │    (systemd)     │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘  │
│                               │                                         │
│                               ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                   Deployed Services                               │ │
│  │                                                                   │ │
│  │  Backend:  systemd aurigraph-v12 (port 9003)                     │ │
│  │  Frontend: NGINX /var/www/aurigraph-portal/current               │ │
│  │  Database: PostgreSQL j4c_db                                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Step 1: SSH to Remote Server

```bash
ssh -p 22 subbu@dlt.aurigraph.io
```

### Step 2: Download and Run Setup Script

```bash
# Download the setup script
curl -O https://raw.githubusercontent.com/Aurigraph-DLT-Corp/Aurigraph-DLT/V12/scripts/ci-cd/setup-self-hosted-runner.sh

# Or copy from local
scp -P 22 scripts/ci-cd/setup-self-hosted-runner.sh subbu@dlt.aurigraph.io:~/

# Make executable and run
chmod +x setup-self-hosted-runner.sh
./setup-self-hosted-runner.sh
```

### Step 3: Get Runner Token from GitHub

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/actions/runners/new
2. Click "New self-hosted runner"
3. Copy the registration token
4. Paste when prompted by the setup script

### Step 4: Verify Runner Status

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/actions/runners
2. Verify "aurigraph-prod-runner" appears with status "Idle" or "Online"

## Workflow Configuration

### Triggers

The CI/CD pipeline triggers on:

1. **Auto-deploy** - Push to `V12` or `main` branches (when backend/frontend files change)
2. **Manual** - Workflow dispatch with options:
   - Deploy Backend only
   - Deploy Frontend only
   - Skip tests
   - Run E2E tests

### Jobs

| Job | Runner Labels | Description |
|-----|---------------|-------------|
| `deploy-backend` | `[self-hosted, Linux, aurigraph-prod]` | Build & deploy Java backend |
| `deploy-frontend` | `[self-hosted, Linux, aurigraph-prod]` | Build & deploy React frontend |
| `e2e-tests` | `[self-hosted, Linux, aurigraph-prod]` | Run Playwright E2E tests |
| `summary` | `[self-hosted, Linux, aurigraph-prod]` | Generate deployment summary |

### Deployment Flow

```
Push → Build Backend → Deploy Backend → Health Check
                    ↘                    ↓
                     Build Frontend → Deploy Frontend
                                           ↓
                                      E2E Tests
                                           ↓
                                       Summary
```

## Runner Management

### Check Runner Status

```bash
# On remote server
cd /home/subbu/actions-runner
sudo ./svc.sh status
```

### View Runner Logs

```bash
# View recent logs
journalctl -u actions.runner.* -n 100 --no-pager

# Follow logs in real-time
journalctl -u actions.runner.* -f
```

### Restart Runner

```bash
cd /home/subbu/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh start
```

### Update Runner

```bash
cd /home/subbu/actions-runner

# Stop service
sudo ./svc.sh stop

# Download latest runner
LATEST=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | jq -r '.tag_name' | sed 's/v//')
curl -O -L "https://github.com/actions/runner/releases/download/v${LATEST}/actions-runner-linux-x64-${LATEST}.tar.gz"

# Extract (preserves config)
tar xzf actions-runner-linux-x64-${LATEST}.tar.gz

# Start service
sudo ./svc.sh start
```

### Remove Runner

```bash
cd /home/subbu/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall
./config.sh remove --token <REMOVAL_TOKEN>
```

## Troubleshooting

### Runner Not Picking Up Jobs

1. Check runner status:
   ```bash
   sudo ./svc.sh status
   ```

2. Verify labels match workflow:
   - Workflow: `runs-on: [self-hosted, Linux, aurigraph-prod]`
   - Runner must have all three labels

3. Check runner is online in GitHub Settings

### Build Failures

1. Check Java version:
   ```bash
   java -version  # Should be 21
   ```

2. Check Node.js version:
   ```bash
   node --version  # Should be 20.x
   ```

3. Check Maven:
   ```bash
   mvn -version
   ```

### Deployment Failures

1. Check service status:
   ```bash
   sudo systemctl status aurigraph-v12
   ```

2. View service logs:
   ```bash
   sudo journalctl -u aurigraph-v12 -n 50 --no-pager
   ```

3. Check port:
   ```bash
   ss -tlnp | grep 9003
   ```

### Health Check Failures

1. Check if service is running:
   ```bash
   curl http://localhost:9003/api/v11/health
   ```

2. Check NGINX proxy:
   ```bash
   curl https://dlt.aurigraph.io/api/v11/health
   ```

3. Check logs for errors:
   ```bash
   sudo journalctl -u aurigraph-v12 | grep -i error | tail -20
   ```

## Directory Structure

```
/home/subbu/
├── actions-runner/           # GitHub Actions runner
│   ├── _work/               # Workflow work directory
│   ├── .runner              # Runner configuration
│   └── svc.sh               # Service control script
├── aurigraph-v12.jar        # Current deployed JAR
├── aurigraph-v12.jar.previous  # Previous version
├── aurigraph-v12.jar.backup-*  # Backup versions
└── logs/                    # Application logs

/var/www/aurigraph-portal/
├── current -> 20241210_153022/  # Symlink to current version
├── 20241210_153022/             # Deployed version
└── 20241209_120000/             # Previous version

/var/lib/aurigraph/
└── leveldb/                 # LevelDB data directory
```

## Security Considerations

1. **Runner Isolation**: Runner runs as `subbu` user, not root
2. **Service Permissions**: systemd service runs as `subbu`
3. **No Secrets in Code**: Database credentials managed via systemd env
4. **Rollback Support**: Automatic rollback on deployment failure
5. **Backup Retention**: Last 5 versions kept for quick rollback

## GitHub Secrets Required

| Secret | Required | Description |
|--------|----------|-------------|
| `SLACK_WEBHOOK_URL` | Optional | Slack notifications |

Note: No SSH keys or passwords needed with self-hosted runner!

## Monitoring

### Deployment Status
- GitHub Actions: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions

### Service Health
- API Health: https://dlt.aurigraph.io/api/v11/health
- Topology: https://dlt.aurigraph.io/api/v11/topology/stats
- Portal: https://dlt.aurigraph.io

### Server Metrics
```bash
# On remote server
htop                              # Resource usage
df -h                             # Disk usage
free -h                           # Memory usage
sudo systemctl status aurigraph-v12  # Service status
```

## Related Documentation

- [CI/CD Overview](../CI_CD_SETUP.md)
- [Deployment Agent Guide](../J4C_DEPLOYMENT_AGENT.md)
- [V12 Deploy Remote Workflow](../../.github/workflows/v12-deploy-remote.yml)
