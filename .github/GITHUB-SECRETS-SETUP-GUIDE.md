# GitHub Secrets Setup Guide

**For:** Aurigraph DLT CI/CD Pipeline
**Updated:** November 26, 2024

---

## Overview

This guide will walk you through setting up GitHub Secrets required for the automated CI/CD pipeline to deploy to your production server (dlt.aurigraph.io).

**Time Required:** ~15 minutes

---

## Prerequisites

- GitHub repository admin access
- SSH access to production server (dlt.aurigraph.io)
- Terminal/command line access

---

## Step 1: Generate SSH Key for GitHub Actions

### Option A: Using Ed25519 (Recommended)

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "github-actions@aurigraph.io" -f ~/.ssh/aurigraph-deploy -N ""

# This creates two files:
# ~/.ssh/aurigraph-deploy       (private key - keep secret!)
# ~/.ssh/aurigraph-deploy.pub   (public key - add to server)
```

### Option B: Using RSA (If Ed25519 not supported)

```bash
# Generate RSA key
ssh-keygen -t rsa -b 4096 -C "github-actions@aurigraph.io" -f ~/.ssh/aurigraph-deploy -N ""
```

---

## Step 2: Add Public Key to Production Server

### 2.1 Copy Public Key

```bash
# Display public key
cat ~/.ssh/aurigraph-deploy.pub

# Output will look like:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions@aurigraph.io
```

### 2.2 Add to Server's Authorized Keys

**Method 1: Using ssh-copy-id (Easiest)**
```bash
ssh-copy-id -i ~/.ssh/aurigraph-deploy.pub -p 22 subbu@dlt.aurigraph.io
```

**Method 2: Manual (If ssh-copy-id not available)**
```bash
# Copy public key
cat ~/.ssh/aurigraph-deploy.pub | pbcopy  # macOS
# or
cat ~/.ssh/aurigraph-deploy.pub | xclip -selection clipboard  # Linux

# SSH to server
ssh -p 22 subbu@dlt.aurigraph.io

# Add key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### 2.3 Test SSH Connection

```bash
# Test with new key
ssh -i ~/.ssh/aurigraph-deploy -p 22 subbu@dlt.aurigraph.io 'echo "Connection successful!"'

# Should output: Connection successful!
```

✅ **Checkpoint:** If you see "Connection successful!", proceed to Step 3

---

## Step 3: Add Private Key to GitHub Secrets

### 3.1 Copy Private Key

```bash
# Display private key (⚠️  KEEP THIS SECRET!)
cat ~/.ssh/aurigraph-deploy

# Output will look like:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
# ... (many lines) ...
# -----END OPENSSH PRIVATE KEY-----
```

**Copy the ENTIRE output** including the BEGIN and END lines.

### 3.2 Add to GitHub

1. **Navigate to Repository Settings**
   ```
   https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add PROD_SSH_KEY**
   - **Name:** `PROD_SSH_KEY`
   - **Value:** Paste the entire private key (from `-----BEGIN` to `-----END`)
   - Click "Add secret"

   ![GitHub Secrets Screenshot](https://docs.github.com/assets/images/help/settings/actions-secrets-add.png)

---

## Step 4: Configure Optional Secrets

### 4.1 Slack Notifications (Optional but Recommended)

If you want deployment notifications in Slack:

1. **Create Slack Incoming Webhook**
   - Go to: https://api.slack.com/messaging/webhooks
   - Click "Create your Slack app"
   - Choose "From scratch"
   - Name: "Aurigraph Deployments"
   - Select your workspace
   - Click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Choose channel (e.g., #deployments)
   - Copy the webhook URL (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

2. **Add to GitHub Secrets**
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your webhook URL
   - Click "Add secret"

### 4.2 Additional Configuration (Optional)

These have defaults but can be overridden:

| Secret Name | Default Value | Purpose |
|------------|---------------|---------|
| `PROD_HOST` | `dlt.aurigraph.io` | Production hostname |
| `PROD_SSH_PORT` | `22` | SSH port |
| `PROD_SSH_USER` | `subbu` | SSH username |

**To add (if needed):**
1. Click "New repository secret"
2. Enter name and value
3. Click "Add secret"

---

## Step 5: Verify Setup

### 5.1 Check Secrets are Configured

Navigate to:
```
https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/secrets/actions
```

You should see:
- ✅ `PROD_SSH_KEY` (required)
- ✅ `SLACK_WEBHOOK_URL` (optional)

### 5.2 Test with Manual Workflow Dispatch

1. **Navigate to Actions**
   ```
   https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
   ```

2. **Select "Unified CI/CD - Backend + Portal"**

3. **Click "Run workflow"**

4. **Configure Test Run:**
   - Branch: `main` (or your current branch)
   - Deploy backend: ✅ (checked)
   - Deploy portal: ✅ (checked)
   - Environment: `production`
   - Skip tests: ✅ (checked for first test)

5. **Click "Run workflow"**

6. **Monitor Progress**
   - Watch the workflow execution
   - Check for any SSH connection errors
   - Verify deployment completes successfully

### 5.3 Expected Output

**Successful Deployment Should Show:**
```
✅ Phase 1: BUILD
  ✅ Build Backend (Java 21, Quarkus)
  ✅ Build Portal (React, TypeScript)

✅ Phase 2: PRE-DEPLOY
  ✅ Setup SSH
  ✅ Pre-deployment health check
  ✅ Create backup

✅ Phase 3: DEPLOY
  ✅ Deploy Backend
  ✅ Deploy Portal

✅ Phase 4: VERIFY
  ✅ Health checks (15/15 passed)
  ✅ Endpoint verification
  ✅ Smoke tests

✅ Phase 5: NOTIFICATIONS
  ✅ Deployment successful notification
```

---

## Troubleshooting

### Issue: SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solutions:**
```bash
# 1. Verify key was added to server
ssh -p 22 subbu@dlt.aurigraph.io 'cat ~/.ssh/authorized_keys | grep github-actions'

# 2. Check key permissions on server
ssh -p 22 subbu@dlt.aurigraph.io 'ls -la ~/.ssh/'
# Should show: -rw------- (600) for authorized_keys

# 3. Test key locally
ssh -i ~/.ssh/aurigraph-deploy -v -p 22 subbu@dlt.aurigraph.io
# Look for "Authenticated with partial success" or "Authenticated"

# 4. Verify private key format
cat ~/.ssh/aurigraph-deploy | head -1
# Should be: -----BEGIN OPENSSH PRIVATE KEY-----
# or: -----BEGIN RSA PRIVATE KEY-----
```

### Issue: Workflow Can't Find Secret

**Error:** `secrets.PROD_SSH_KEY is not defined`

**Solutions:**
1. Verify secret name is **exactly** `PROD_SSH_KEY` (case-sensitive)
2. Check you're in the correct repository
3. Ensure you have admin access to the repository
4. Secrets may take 1-2 minutes to propagate

### Issue: Deployment Health Check Fails

**Error:** `Health check failed after 15 attempts`

**Solutions:**
```bash
# 1. Check if service is running
ssh -p 22 subbu@dlt.aurigraph.io 'lsof -i:9003'

# 2. Check logs
ssh -p 22 subbu@dlt.aurigraph.io 'tail -100 /tmp/v12-production.log'

# 3. Test health endpoint from server
ssh -p 22 subbu@dlt.aurigraph.io 'curl -s http://localhost:9003/api/v11/health'

# 4. Check firewall
ssh -p 22 subbu@dlt.aurigraph.io 'sudo iptables -L -n | grep 9003'
```

### Issue: Slack Notifications Not Working

**Error:** No notifications in Slack

**Solutions:**
1. Verify webhook URL is correct
2. Test webhook manually:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test from Aurigraph CI/CD"}' \
     YOUR_WEBHOOK_URL
   ```
3. Check workflow logs for Slack step errors
4. Ensure webhook is for the correct Slack workspace

---

## Security Best Practices

### ✅ DO:
- Store private keys in GitHub Secrets only
- Use Ed25519 keys (more secure than RSA)
- Create dedicated deployment keys
- Rotate keys every 90 days
- Delete old keys after rotation
- Use SSH key without passphrase for automation
- Limit key permissions on server

### ❌ DON'T:
- Commit private keys to repository
- Share private keys via email/Slack
- Use personal SSH keys for deployment
- Give deployment keys sudo access
- Leave old keys active after rotation

---

## Key Rotation Procedure

**Frequency:** Every 90 days

1. **Generate new key:**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions@aurigraph.io-$(date +%Y%m)" -f ~/.ssh/aurigraph-deploy-new -N ""
   ```

2. **Add new key to server** (alongside old key)

3. **Update GitHub Secret** with new private key

4. **Test deployment** with new key

5. **Remove old key from server**
   ```bash
   ssh -p 22 subbu@dlt.aurigraph.io
   nano ~/.ssh/authorized_keys
   # Remove old key line
   ```

---

## Summary Checklist

Before first deployment, ensure:

- [ ] SSH key pair generated
- [ ] Public key added to server
- [ ] SSH connection tested successfully
- [ ] Private key added to GitHub Secrets as `PROD_SSH_KEY`
- [ ] Optional: Slack webhook configured
- [ ] Manual workflow dispatch tested
- [ ] Deployment completed successfully
- [ ] Health checks passed
- [ ] Services accessible at https://dlt.aurigraph.io

---

## Next Steps

After successful setup:

1. **Enable Automatic Deployments**
   - Push to `main` branch will auto-deploy
   - Monitoring will track all deployments

2. **Configure Slack Notifications**
   - Get real-time deployment updates
   - Monitor success/failure rates

3. **Set Up Monitoring Dashboard**
   - Track deployment frequency
   - Monitor deployment duration
   - Review success rates

4. **Document Team Process**
   - Who can trigger deployments
   - Rollback procedures
   - Emergency contacts

---

## Support

**Issues with Setup?**
- Check [troubleshooting section](#troubleshooting) above
- Review workflow logs in GitHub Actions
- Check [CI/CD Documentation](.github/workflows/README.md)
- Open issue: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

**Need Help?**
- Slack: #devops channel
- Email: devops@aurigraph.io
- JIRA: Create ticket in AV11 project

---

**Guide Version:** 1.0
**Last Updated:** November 26, 2024
**Maintained By:** DevOps Team
