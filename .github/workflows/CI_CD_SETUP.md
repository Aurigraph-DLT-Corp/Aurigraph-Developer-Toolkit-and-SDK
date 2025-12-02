# CI/CD Setup Guide for Aurigraph V12

This guide explains how to set up CI/CD for deploying the Aurigraph V12 platform to the remote server.

## Available Workflows

### 1. `deploy-fullstack.yml` (Recommended)
Unified workflow that deploys both backend and frontend together.

**Triggers:**
- Push to `V12` or `main` branches (when backend or frontend files change)
- Manual dispatch with options:
  - Deploy Backend only
  - Deploy Frontend only
  - Skip tests
  - Force deploy

### 2. `ssh-deploy.yml`
Simple backend-only deployment via SSH.

### 3. `enterprise-portal-ci.yml`
Frontend-only CI/CD with tests.

## Required GitHub Secrets

Configure these secrets in your GitHub repository:
`Settings → Secrets and variables → Actions → New repository secret`

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PROD_SSH_PRIVATE_KEY` | SSH private key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PROD_SSH_USER` | SSH username (optional, defaults to `subbu`) | `subbu` |
| `PROD_SSH_PORT` | SSH port (optional, defaults to `22`) | `22` |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for deployment notifications |
| `SNYK_TOKEN` | Snyk API token for security scanning |

## Setting Up SSH Key Authentication

### Step 1: Generate SSH Key Pair (if not exists)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Or use RSA if ed25519 not supported
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

### Step 2: Add Public Key to Server

```bash
# Copy the public key
cat ~/.ssh/github_deploy_key.pub

# SSH to server and add to authorized_keys
ssh subbu@dlt.aurigraph.io
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Private Key to GitHub Secrets

```bash
# Copy the private key content
cat ~/.ssh/github_deploy_key

# Go to GitHub Repository:
# Settings → Secrets and variables → Actions → New repository secret
# Name: PROD_SSH_PRIVATE_KEY
# Value: Paste entire private key including BEGIN/END lines
```

## Manual Deployment

You can manually trigger deployments from GitHub:

1. Go to **Actions** tab in your repository
2. Select **Full Stack Deployment** workflow
3. Click **Run workflow**
4. Choose options:
   - `Deploy Backend`: Build and deploy Java backend
   - `Deploy Frontend`: Build and deploy React frontend
   - `Skip tests`: Faster deployment without tests
   - `Force deploy`: Deploy even if health checks fail

## Automatic Deployment

Deployments trigger automatically when you push to `V12` or `main` branches:

- **Backend changes**: `src/**`, `pom.xml`
- **Frontend changes**: `enterprise-portal/src/**`, `enterprise-portal/package.json`

## Server Requirements

The remote server (dlt.aurigraph.io) should have:

- Java 21 installed
- PostgreSQL running with `j4c_db` database
- NGINX configured to proxy:
  - `/api/v11/*` → `localhost:9003`
  - `/` → `/var/www/aurigraph-portal/current/`
- Directories:
  - `/home/subbu/` - Backend JAR location
  - `/var/www/aurigraph-portal/` - Frontend deployment location

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Push to V12/main                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Parallel Build Phase                            │
│  ┌────────────────────┐    ┌────────────────────┐           │
│  │  Build Backend     │    │  Build Frontend    │           │
│  │  (Maven/Quarkus)   │    │  (npm/Vite)        │           │
│  └─────────┬──────────┘    └─────────┬──────────┘           │
│            │                          │                      │
│            ▼                          ▼                      │
│  ┌────────────────────┐    ┌────────────────────┐           │
│  │  Upload Artifact   │    │  Upload Artifact   │           │
│  │  (backend-jar)     │    │  (frontend-dist)   │           │
│  └─────────┬──────────┘    └─────────┬──────────┘           │
└────────────┼──────────────────────────┼─────────────────────┘
             │                          │
             └──────────┬───────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Deploy Phase                              │
│  1. Setup SSH connection                                     │
│  2. Download artifacts                                       │
│  3. Deploy Backend:                                          │
│     - Backup current JAR                                     │
│     - Stop existing process                                  │
│     - Upload new JAR                                         │
│     - Start with JVM options                                 │
│     - Health check                                           │
│  4. Deploy Frontend:                                         │
│     - Create timestamped directory                           │
│     - Upload dist files                                      │
│     - Update symlink                                         │
│     - Reload NGINX                                           │
│  5. Verify deployment                                        │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### SSH Connection Failed
- Verify SSH key is correctly added to GitHub secrets
- Check server's authorized_keys file
- Ensure server firewall allows SSH on port 22

### Backend Won't Start
- Check logs: `ssh subbu@dlt.aurigraph.io 'tail -100 /home/subbu/logs/main-api.log'`
- Verify PostgreSQL is running: `systemctl status postgresql`
- Check port 9003 is free: `ss -tlnp | grep 9003`

### Frontend Not Updating
- Verify NGINX symlink: `ls -la /var/www/aurigraph-portal/current`
- Reload NGINX: `sudo systemctl reload nginx`
- Check NGINX config: `sudo nginx -t`

### Health Check Failures
- Backend may take 20-30 seconds to fully start
- Check Quarkus logs for startup errors
- Verify database connection settings

## Rollback

If deployment fails, the workflow automatically attempts rollback:

1. Finds most recent backup JAR (`aurigraph-v12.jar.backup-*`)
2. Stops failed deployment
3. Restores backup JAR
4. Restarts service

Manual rollback:
```bash
ssh subbu@dlt.aurigraph.io
cd /home/subbu
pkill -f aurigraph-v12.jar
cp aurigraph-v12.jar.backup-YYYYMMDD_HHMMSS aurigraph-v12.jar
# Restart service
```
