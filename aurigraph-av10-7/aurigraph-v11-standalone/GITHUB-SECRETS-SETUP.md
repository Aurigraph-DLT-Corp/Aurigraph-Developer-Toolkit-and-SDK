# GitHub Secrets Setup for Aurigraph V11 CI/CD Pipeline

This guide explains how to configure GitHub Secrets required for the automated CI/CD pipeline to build, test, and deploy Aurigraph V11 node variants to `dlt.aurigraph.io`.

## Overview

The GitHub Actions workflow requires two secrets:

1. **DEPLOY_SSH_KEY** - SSH private key for authenticating to the remote deployment server
2. **GITHUB_TOKEN** - Auto-generated token for authenticating to GitHub Container Registry (default, usually already configured)

## Prerequisites

- Access to GitHub repository: `https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT`
- Admin permissions to configure repository secrets
- SSH private key for `subbu@dlt.aurigraph.io`

## Step 1: Prepare SSH Private Key

You'll need the SSH private key that can authenticate to `dlt.aurigraph.io` as user `subbu`.

The key should be in PEM format (typical format for OpenSSH keys):

```bash
# Check your SSH key format
head -1 ~/.ssh/id_rsa
# Should show: -----BEGIN OPENSSH PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----
```

If using ED25519 keys:
```bash
# Check ED25519 key format
head -1 ~/.ssh/id_ed25519
# Should show: -----BEGIN OPENSSH PRIVATE KEY-----
```

## Step 2: Configure GitHub Secrets

### Method 1: GitHub Web Interface (Recommended for Most Users)

1. Navigate to the repository: `https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT`

2. Go to **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret**

4. Create the first secret:
   - **Name**: `DEPLOY_SSH_KEY`
   - **Value**: Paste the entire contents of your SSH private key file
     ```bash
     # Get the full key content
     cat ~/.ssh/id_rsa
     # Copy the entire output (including BEGIN and END lines)
     ```
   - Click **Add secret**

5. The `GITHUB_TOKEN` secret is automatically provided by GitHub Actions and doesn't need manual configuration

### Method 2: GitHub CLI

If you have the GitHub CLI installed:

```bash
# Login to GitHub (if not already logged in)
gh auth login

# Add the DEPLOY_SSH_KEY secret
gh secret set DEPLOY_SSH_KEY --body "$(cat ~/.ssh/id_rsa)"

# Verify the secret was added
gh secret list
```

## Step 3: Verify Secret Configuration

To verify secrets are configured correctly:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - ✅ `DEPLOY_SSH_KEY` (with a green checkmark)
   - Note: `GITHUB_TOKEN` is provided by GitHub and won't appear in the list

## Step 4: Test the CI/CD Pipeline

### Option A: Automatic Trigger (via Push)

Push a change to the `main` branch:

```bash
git checkout main
git add .
git commit -m "test: Trigger CI/CD pipeline"
git push origin main
```

### Option B: Manual Workflow Dispatch

1. Go to **Actions** tab in the GitHub repository
2. Select **"Build and Deploy Aurigraph V11 Node Variants"** workflow
3. Click **Run workflow**
4. Select parameters:
   - **Node type**: `all` (or select specific: validator, business, integration)
   - **Build variant**: `all` (or select specific: dev, staging, prod)
5. Click **Run workflow**

### Monitoring the Workflow

1. Go to **Actions** tab
2. Click on the active workflow run
3. Watch the progress of:
   - **build** job (creates Docker images - ~5-10 minutes)
   - **test** job (validates images - ~2-3 minutes)
   - **deploy** job (deploys to remote server - ~5 minutes)

## Step 5: Troubleshooting

### SSH Authentication Failure

**Error**: `SSH key authentication failed`

**Causes**:
- SSH key format is incorrect (not PEM)
- Key doesn't have permission to access `dlt.aurigraph.io`
- Remote server SSH configuration doesn't match

**Solutions**:
```bash
# Verify SSH key permissions (should be 600)
ls -la ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa

# Test SSH connection manually
ssh -i ~/.ssh/id_rsa -p 22 subbu@dlt.aurigraph.io "echo 'SSH works'"

# If using non-standard key location, update the secret with correct key
```

### Docker Registry Authentication Failure

**Error**: `Failed to authenticate to container registry`

**Causes**:
- GITHUB_TOKEN doesn't have `packages:write` permission
- Token has expired or been revoked

**Solutions**:
1. Repository should have default `GITHUB_TOKEN` with correct permissions
2. Check workflow file has correct permissions:
   ```yaml
   permissions:
     contents: read
     packages: write
   ```

### Image Pull Failure

**Error**: `Failed to pull image from ghcr.io`

**Causes**:
- Image hasn't been built yet
- Image tag is incorrect
- Registry authentication issue

**Solutions**:
1. Ensure build job completed successfully
2. Check image name matches: `ghcr.io/aurigraph-dlt-corp/aurigraph-dlt/aurigraph-<node-type>:<tag>`
3. Verify GitHub Container Registry authentication

### Health Check Failure

**Error**: `Health check failed - service not responding`

**Causes**:
- Service took longer than expected to start
- Port is already in use
- Service crashed during startup

**Solutions**:
1. SSH to remote server and check logs:
   ```bash
   ssh subbu@dlt.aurigraph.io
   docker logs validator-node-1
   docker ps  # Check if containers are running
   ```
2. Check port availability:
   ```bash
   ssh subbu@dlt.aurigraph.io "lsof -i :9003"
   ```
3. Review Deployment Guide troubleshooting section

## Secret Security Best Practices

1. **Rotate SSH keys regularly** - Every 6-12 months
2. **Never commit secrets** - Always use GitHub Secrets
3. **Use dedicated deployment keys** - Don't use personal SSH keys
4. **Limit key permissions** - SSH key should only allow deployment operations
5. **Monitor access logs** - Check remote server logs for unauthorized access attempts
6. **Store SSH keys securely** - Use ssh-agent or similar key management tools

## Managing Deployment SSH Keys

### Generating a New Deployment Key

If you need to generate a new SSH key specifically for deployments:

```bash
# Generate new key
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "aurigraph-dlt-deployment"

# Add to remote server
ssh-copy-id -i ~/.ssh/deploy_key.pub -p 22 subbu@dlt.aurigraph.io

# Copy private key to GitHub Secrets (value for DEPLOY_SSH_KEY)
cat ~/.ssh/deploy_key
```

### Revoking Old Deployment Keys

```bash
# SSH to remote server
ssh subbu@dlt.aurigraph.io

# Edit authorized_keys to remove old key
nano ~/.ssh/authorized_keys

# Remove the line containing the old key, save and exit
# Verify access still works with new key
```

## Environment Variables Used by Workflow

The workflow automatically uses these environment variables (defined in `.github/workflows/build-and-deploy.yml`):

| Variable | Value | Purpose |
|----------|-------|---------|
| `REGISTRY` | `ghcr.io` | GitHub Container Registry |
| `IMAGE_NAME` | `${{ github.repository }}/aurigraph` | Container image name prefix |
| `VERSION` | `11.0.0` | Application version tag |
| `BUILD_TYPE` | `dev`, `staging`, or `prod` | Build optimization level |

## Deployment Flow

```
Code Push/Dispatch
    ↓
[Build Job] - Matrix (3×3 = 9 variants)
    • Validator (dev, staging, prod)
    • Business (dev, staging, prod)
    • Integration (dev, staging, prod)
    ↓
[Test Job] - Validates all 9 images
    ↓
[Deploy Job] - Only on main branch push
    • SSH to dlt.aurigraph.io
    • Pull production images
    • Tag images
    • Run docker-compose up -d
    • Verify health checks
    ↓
[Notification] - Comments on PR/issue with status
```

## Rollback Procedure

If a deployment fails or needs to be rolled back:

1. SSH to the remote server:
   ```bash
   ssh subbu@dlt.aurigraph.io
   ```

2. Check current containers:
   ```bash
   docker ps | grep aurigraph
   ```

3. Pull previous image version and redeploy:
   ```bash
   cd ~/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
   docker pull ghcr.io/aurigraph-dlt-corp/aurigraph-dlt/aurigraph-validator:main-prod
   docker-compose -f docker-compose.prod.yml up -d
   ```

See `DEPLOYMENT-GUIDE.md` for complete rollback procedures.

## Support

For issues with:

- **SSH Configuration**: See `DEPLOYMENT-GUIDE.md` SSH section
- **Docker/Kubernetes**: Check Docker documentation and your server setup
- **GitHub Actions**: See `.github/workflows/build-and-deploy.yml`
- **Aurigraph V11 Deployment**: See `DEPLOYMENT-GUIDE.md`

## References

- GitHub Secrets Documentation: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- GitHub Actions: https://docs.github.com/en/actions
- Docker Build and Push Action: https://github.com/docker/build-push-action
- GitHub Container Registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
