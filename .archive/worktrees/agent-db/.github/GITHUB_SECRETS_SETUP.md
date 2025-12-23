# GitHub Secrets Setup Guide

This guide documents all required GitHub Secrets for the Aurigraph V11 CI/CD pipeline to function correctly.

## Overview

GitHub Secrets are environment variables encrypted and stored by GitHub. They are used by GitHub Actions workflows to safely handle sensitive data like credentials, API keys, and tokens without exposing them in logs or code.

**Total Required Secrets**: 15+
**Setup Time**: 10-15 minutes

---

## Categories & Required Secrets

### 1. Docker Registry & Container Build (2 secrets)

#### `GHCR_USERNAME`
- **Value**: Your GitHub username
- **Purpose**: Authenticate to GitHub Container Registry (ghcr.io)
- **Used By**: ci.yml (docker build and push)
- **How to Set**: GitHub username

#### `GHCR_TOKEN`
- **Value**: GitHub Personal Access Token with `write:packages` scope
- **Purpose**: Authenticate pushing Docker images to ghcr.io
- **Used By**: ci.yml (docker build and push)
- **How to Set**:
  1. Navigate to https://github.com/settings/tokens
  2. Click "Generate new token" → "Generate new token (classic)"
  3. Add scopes: `write:packages`, `read:packages`, `delete:packages`
  4. Copy and paste the token value

### 2. Deployment Credentials (3 secrets)

#### `DEPLOY_HOST`
- **Value**: `dlt.aurigraph.io`
- **Purpose**: SSH target host for deployment
- **Used By**: deploy.yml
- **How to Set**: Server hostname or IP

#### `DEPLOY_USER`
- **Value**: `subbu`
- **Purpose**: SSH username for remote server access
- **Used By**: deploy.yml
- **How to Set**: Username with SSH access

#### `DEPLOY_KEY`
- **Value**: SSH private key for authentication
- **Purpose**: Authentication for remote server deployment
- **Used By**: deploy.yml (SSH key-based auth)
- **How to Set**:
  1. Use an SSH key pair (generate if needed: `ssh-keygen -t ed25519`)
  2. Ensure public key is in remote server's `~/.ssh/authorized_keys`
  3. Copy full private key content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
  4. Paste into GitHub Secret

#### `DEPLOY_PORT`
- **Value**: `22`
- **Purpose**: SSH port for remote server
- **Used By**: deploy.yml
- **How to Set**: SSH port (typically 22)

### 3. Code Quality & Security Scanning (3 secrets)

#### `SONAR_HOST_URL`
- **Value**: `https://sonarqube.example.com` (or SonarCloud URL)
- **Purpose**: SonarQube instance for code quality analysis
- **Used By**: ci.yml (SonarQube scan)
- **How to Set**: Your SonarQube/SonarCloud server URL

#### `SONAR_TOKEN`
- **Value**: SonarQube authentication token
- **Purpose**: Authenticate to SonarQube for code quality scans
- **Used By**: ci.yml (sonar-scanner)
- **How to Set**:
  1. Log into your SonarQube/SonarCloud instance
  2. Navigate to Account → Security → Tokens
  3. Generate new token
  4. Copy token value

#### `SNYK_TOKEN`
- **Value**: Snyk API token
- **Purpose**: Authenticate to Snyk for vulnerability scanning
- **Used By**: security.yml (dependency scanning)
- **How to Set**:
  1. Create account at https://snyk.io
  2. Navigate to Settings → Auth Token
  3. Copy token value

### 4. Notifications & Alerting (3 secrets)

#### `SLACK_WEBHOOK_URL`
- **Value**: Slack webhook URL for notifications
- **Purpose**: Send deployment status and alerts to Slack
- **Used By**: deploy.yml (notification job)
- **How to Set**:
  1. In Slack workspace, create new Webhook: https://api.slack.com/messaging/webhooks
  2. Create incoming webhook to desired channel
  3. Copy webhook URL

#### `SLACK_CHANNEL`
- **Value**: `#deployments` (or other channel)
- **Purpose**: Slack channel for notifications
- **Used By**: deploy.yml (notification job)
- **How to Set**: Channel name or ID

#### `EMAIL_RECIPIENTS`
- **Value**: `ops-team@dlt.aurigraph.io,ci-alerts@dlt.aurigraph.io`
- **Purpose**: Email recipients for deployment alerts
- **Used By**: deploy.yml (email notifications)
- **How to Set**: Comma-separated email addresses

### 5. Database & Infrastructure (2+ secrets)

#### `DB_PASSWORD`
- **Value**: PostgreSQL password for `aurigraph` user
- **Purpose**: Database access during deployment/testing
- **Used By**: integration tests, deployment scripts
- **How to Set**: PostgreSQL password (use secure password)

#### `DB_HOST`
- **Value**: `127.0.0.1` or `dlt.aurigraph.io`
- **Purpose**: PostgreSQL host for testing/deployment
- **Used By**: integration tests, deployment validation
- **How to Set**: Database hostname or IP

### 6. Optional: Monitoring & Observability (2+ secrets)

#### `PAGERDUTY_SERVICE_KEY`
- **Value**: PagerDuty service integration key
- **Purpose**: Send critical alerts to PagerDuty
- **Used By**: alertmanager configuration
- **How to Set**:
  1. In PagerDuty, create service
  2. Get integration key from service settings
  3. Copy key value

#### `DATADOG_API_KEY`
- **Value**: Datadog API key
- **Purpose**: Send metrics to Datadog
- **Used By**: monitoring configuration
- **How to Set**:
  1. In Datadog, navigate to Integrations → APIs
  2. Copy API key

---

## Setup Instructions

### Step 1: Navigate to GitHub Settings
1. Go to https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
2. Click Settings → Secrets and variables → Actions

### Step 2: Add Each Secret
For each required secret:
1. Click "New repository secret"
2. Enter **Name** (exactly as shown above)
3. Enter **Value** (the actual credential)
4. Click "Add secret"

### Step 3: Verify Secrets Are Set
```bash
# In GitHub Actions, you cannot see secret values (they're masked)
# But you can verify they exist by checking workflow logs show [***] for masked secrets
```

### Step 4: Test Secret Access
Create a test workflow to verify secrets are accessible:
```yaml
name: Test Secrets
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "GHCR_USERNAME is set: ${{ secrets.GHCR_USERNAME != '' }}"
      - run: echo "DEPLOY_HOST is set: ${{ secrets.DEPLOY_HOST != '' }}"
```

---

## Secret Rotation & Security Best Practices

### Rotation Schedule
- **Monthly**: GitHub PATs, SSH keys
- **Quarterly**: Database passwords
- **On-demand**: After compromises or personnel changes

### Security Practices
1. **Never commit secrets**: Always use GitHub Secrets or environment variables
2. **Minimal access**: Grant secrets only to necessary workflows
3. **Audit access**: Review which workflows use each secret
4. **Secure storage**: Use encrypted vaults for non-GitHub secrets
5. **Key management**: Rotate SSH keys and tokens regularly
6. **Access control**: Limit who can view/edit secrets (require organization member status)

### Revocation Steps
If a secret is compromised:
1. Delete secret from GitHub immediately
2. Revoke/regenerate at source (PAT, SSH key, API token)
3. Update secret in GitHub with new value
4. Re-run any workflows that may have cached old value

---

## Troubleshooting

### Secret Not Available in Workflow
- **Issue**: Workflow shows `secrets.VARIABLE_NAME` is undefined
- **Solution**:
  - Verify secret name matches exactly (case-sensitive)
  - Ensure workflow has access to secrets (check file permissions)
  - Re-run workflow after adding secret

### Deployment Fails with Auth Error
- **Issue**: "Permission denied (publickey)" or auth failure
- **Solution**:
  - Verify DEPLOY_KEY private key format and permissions
  - Ensure public key is in remote server's `~/.ssh/authorized_keys`
  - Check DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT are correct
  - Test SSH manually: `ssh -i key.pem -p 22 subbu@dlt.aurigraph.io`

### SonarQube Token Invalid
- **Issue**: SonarQube scan fails with "Unauthorized"
- **Solution**:
  - Regenerate token in SonarQube
  - Verify token has correct scopes
  - Update SONAR_TOKEN in GitHub Secrets

### Docker Push Fails
- **Issue**: "unauthorized: authentication required"
- **Solution**:
  - Verify GHCR_TOKEN is correct and has `write:packages` scope
  - Ensure GHCR_USERNAME matches GitHub username
  - Test locally: `echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin`

---

## Complete Checklist

Use this checklist to verify all secrets are configured:

- [ ] GHCR_USERNAME
- [ ] GHCR_TOKEN
- [ ] DEPLOY_HOST
- [ ] DEPLOY_USER
- [ ] DEPLOY_KEY
- [ ] DEPLOY_PORT
- [ ] SONAR_HOST_URL
- [ ] SONAR_TOKEN
- [ ] SNYK_TOKEN
- [ ] SLACK_WEBHOOK_URL
- [ ] SLACK_CHANNEL
- [ ] EMAIL_RECIPIENTS
- [ ] DB_PASSWORD
- [ ] DB_HOST
- [ ] PAGERDUTY_SERVICE_KEY (optional)
- [ ] DATADOG_API_KEY (optional)

**Total**: 14 required + 2 optional = 16 maximum

---

## References

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
- [SonarQube Token Generation](https://docs.sonarqube.org/latest/user-guide/user-token/)
- [Snyk API Documentation](https://snyk.io/api)
