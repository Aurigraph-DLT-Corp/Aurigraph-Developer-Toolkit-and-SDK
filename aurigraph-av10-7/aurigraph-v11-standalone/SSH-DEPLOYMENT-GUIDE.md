# SSH/SCP-Based Deployment Guide

**Date**: October 31, 2025
**Version**: 4.8.0 with Login Page Flashing Fix
**Deployment Method**: SSH/SCP Transfer + On-Server Installation

---

## Quick Start

### Prerequisites
- SSH access to `subbu@dlt.aurigraph.io` (port 2235)
- Server must be reachable (can be behind firewall, bastion, or jumphost)
- Network connectivity from deployment server

### One-Command Deployment (From Remote Server)

If you can SSH to the remote server, execute these commands **on that server**:

```bash
# 1. Transfer the deployment package (from this machine to remote)
scp -P 2235 aurigraph-v11-deployment-20251031_173118.tar.gz subbu@dlt.aurigraph.io:/tmp/

# 2. SSH to remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# 3. Extract and deploy (run these commands ON the remote server)
cd /tmp
tar -xzf aurigraph-v11-deployment-20251031_173118.tar.gz
./deploy-on-remote.sh
```

---

## What's Included in Deployment Package

**File**: `aurigraph-v11-deployment-20251031_173118.tar.gz` (159 MB)

**Contents**:
```
├── target/
│   └── aurigraph-v11-standalone-11.4.4-runner.jar (176 MB)
├── enterprise-portal/dist/
│   └── [Production frontend build]
├── deploy-on-remote.sh
│   └── On-server deployment script
├── deploy-remote-testing.sh
│   └── Alternative deployment method
├── REMOTE-TESTING-GUIDE.md
│   └── Comprehensive testing guide
└── [other supporting files]
```

---

## Deployment Methods

### Method 1: Direct SSH (Easiest)

**When**: You have direct SSH access to the server

**Steps**:

```bash
# From your local machine
scp -P 2235 aurigraph-v11-deployment-20251031_173118.tar.gz subbu@dlt.aurigraph.io:/tmp/

ssh -p 2235 subbu@dlt.aurigraph.io
```

**On remote server**:

```bash
cd /tmp
tar -xzf aurigraph-v11-deployment-20251031_173118.tar.gz
./deploy-on-remote.sh
```

**Time**: 5-10 minutes total

---

### Method 2: Using Jumphost/Bastion

**When**: Direct access blocked, but you can reach server through bastion

**Prerequisites**:
- Bastion server: `bastion.example.com:2222`
- Bastion has access to `dlt.aurigraph.io:2235`

**Steps**:

```bash
# From your local machine with ProxyCommand
scp -P 2235 \
  -o ProxyCommand='ssh -p 2222 jumphost.example.com nc %h %p' \
  aurigraph-v11-deployment-20251031_173118.tar.gz \
  subbu@dlt.aurigraph.io:/tmp/

# SSH via jumphost
ssh -p 2235 \
  -o ProxyCommand='ssh -p 2222 jumphost.example.com nc %h %p' \
  subbu@dlt.aurigraph.io
```

**On remote server**:

```bash
cd /tmp
tar -xzf aurigraph-v11-deployment-20251031_173118.tar.gz
./deploy-on-remote.sh
```

**Time**: 5-10 minutes total

---

### Method 3: Using SSH Tunnel

**When**: You need to establish a tunnel first

**Steps**:

```bash
# Terminal 1: Establish tunnel
ssh -p 2235 -L 2235:dlt.aurigraph.io:22 subbu@bastion &

# Terminal 2: Transfer via tunnel
scp -P 2235 \
  aurigraph-v11-deployment-20251031_173118.tar.gz \
  localhost:/tmp/

# Terminal 2: Connect via tunnel
ssh -p 2235 localhost
```

**On remote server**:

```bash
cd /tmp
tar -xzf aurigraph-v11-deployment-20251031_173118.tar.gz
./deploy-on-remote.sh
```

**Time**: 5-10 minutes total

---

### Method 4: Using ~/.ssh/config

**When**: You want to configure SSH parameters in config file

**~/.ssh/config**:

```
Host aurigraph
    HostName dlt.aurigraph.io
    Port 2235
    User subbu
    ProxyCommand ssh -p 2222 bastion.example.com nc %h %p  # Optional
```

**Steps**:

```bash
# Transfer
scp aurigraph-v11-deployment-20251031_173118.tar.gz aurigraph:/tmp/

# Connect
ssh aurigraph

# On remote server
cd /tmp
tar -xzf aurigraph-v11-deployment-20251031_173118.tar.gz
./deploy-on-remote.sh
```

**Time**: 5-10 minutes total

---

## On-Server Deployment Script

The package includes `deploy-on-remote.sh` which handles:

```
[1/5] Verify artifacts
[2/5] Create backups (backend and frontend)
[3/5] Deploy backend JAR to /opt/aurigraph/v11
[4/5] Deploy frontend build to /var/www/dlt.aurigraph.io
[5/5] Restart services (aurigraph-v11 and nginx)
```

### What the Script Does

1. **Verify Artifacts**
   - Checks backend JAR exists
   - Checks frontend build exists
   - Exits if anything missing

2. **Create Backups**
   - Backend: `/opt/aurigraph/v11/backups/aurigraph-v11-standalone-11.4.4-runner_TIMESTAMP.jar`
   - Frontend: `/var/www/dlt.aurigraph.io.bak_TIMESTAMP/`
   - Allows rollback if needed

3. **Deploy Backend**
   - Copy JAR to `/opt/aurigraph/v11/`
   - Preserves original filename and structure

4. **Deploy Frontend**
   - Copy all dist files to `/var/www/dlt.aurigraph.io/`
   - Replaces old frontend with new build
   - Maintains directory structure

5. **Restart Services**
   - `sudo systemctl restart aurigraph-v11` (Backend)
   - `sudo systemctl restart nginx` (Frontend)
   - Verifies both services start successfully

---

## Testing After Deployment

### Access the Portal

```
Frontend: https://dlt.aurigraph.io
Login: admin/admin
Backend Health: https://dlt.aurigraph.io/api/v11/health
```

### Quick Verification

**In Browser**:
1. Navigate to https://dlt.aurigraph.io
2. Should see login page (no flashing)
3. Login with admin/admin
4. Dashboard should load with metrics
5. Check DevTools Console (F12) for errors

**From Remote Server**:

```bash
# Check backend service
sudo systemctl status aurigraph-v11

# Check NGINX
sudo systemctl status nginx

# Test API
curl -k https://localhost/api/v11/health

# View logs
sudo journalctl -u aurigraph-v11 -n 20
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Issue 1: "Connection refused" during SCP

**Symptom**:
```
ssh: connect to host dlt.aurigraph.io port 2235: Connection refused
```

**Solutions**:
1. Verify server is online: `ping dlt.aurigraph.io`
2. Check SSH port: `ssh -p 2235 subbu@dlt.aurigraph.io`
3. Try without port specification if default is 2235
4. Verify bastion/jumphost configuration if using proxy

### Issue 2: "Permission denied" on remote server

**Symptom**:
```
Permission denied (publickey,password)
```

**Solutions**:
1. Verify SSH key is in `~/.ssh/` on local machine
2. Add public key to `~/.ssh/authorized_keys` on remote
3. Try password authentication: `ssh -p 2235 subbu@dlt.aurigraph.io`
4. Check SSH key permissions: `chmod 600 ~/.ssh/id_rsa`

### Issue 3: "tar: cannot open: No such file"

**Symptom**:
```
tar: aurigraph-v11-deployment-*.tar.gz: Cannot open: No such file or directory
```

**Solutions**:
1. Verify package transferred: `ls -lh /tmp/aurigraph-v11-deployment*.tar.gz`
2. Check filename spelling
3. Verify transfer completed successfully (check file size)
4. Ensure package is in /tmp directory

### Issue 4: "sudo: systemctl: command not found"

**Symptom**:
```
sudo: systemctl: command not found
```

**Solutions**:
1. Check OS is systemd-based: `which systemctl`
2. Use alternative service restart if systemd not available
3. Verify sudo permissions for deployment user

### Issue 5: "nginx: [error] open() failed"

**Symptom**:
```
nginx: [error] open() "/var/www/dlt.aurigraph.io/index.html" failed
```

**Solutions**:
1. Verify frontend files deployed: `ls -la /var/www/dlt.aurigraph.io/`
2. Check file permissions: `sudo chmod -R 755 /var/www/dlt.aurigraph.io/`
3. Check NGINX config points to correct directory
4. Verify index.html exists in dist

---

## Rollback Procedure

If something goes wrong after deployment:

### Rollback Backend

```bash
# List available backups
ls -t /opt/aurigraph/v11/backups/ | head -5

# Restore specific backup
sudo cp /opt/aurigraph/v11/backups/aurigraph-v11-standalone-11.4.4-runner_20251031_173118.jar \
        /opt/aurigraph/v11/aurigraph-v11-standalone-11.4.4-runner.jar

# Restart service
sudo systemctl restart aurigraph-v11

# Verify
sudo systemctl status aurigraph-v11
```

### Rollback Frontend

```bash
# List available backups
ls -d /var/www/dlt.aurigraph.io.bak* | sort -r | head -1

# Restore backup
sudo cp -r /var/www/dlt.aurigraph.io.bak_20251031_173118/* /var/www/dlt.aurigraph.io/

# Reload NGINX
sudo systemctl reload nginx

# Verify
sudo systemctl status nginx
```

### Complete Rollback

```bash
# Restore both services
sudo cp /opt/aurigraph/v11/backups/aurigraph-v11-standalone-11.4.4-runner_TIMESTAMP.jar \
        /opt/aurigraph/v11/aurigraph-v11-standalone-11.4.4-runner.jar
sudo cp -r /var/www/dlt.aurigraph.io.bak_TIMESTAMP/* /var/www/dlt.aurigraph.io/

# Restart both
sudo systemctl restart aurigraph-v11 nginx
```

---

## Deployment Checklist

### Before Transfer

- [ ] Deployment package file exists: `aurigraph-v11-deployment-*.tar.gz` (159 MB)
- [ ] SSH access verified: `ssh -p 2235 subbu@dlt.aurigraph.io`
- [ ] Bastion/jumphost configured (if needed)
- [ ] Network connectivity to server confirmed

### Before On-Server Deployment

- [ ] Package transferred successfully to `/tmp/`
- [ ] Package size correct (~159 MB)
- [ ] Package extracted: `tar -xzf aurigraph-v11-deployment-*.tar.gz`
- [ ] Files visible: `ls -la target/ enterprise-portal/dist/ deploy-on-remote.sh`

### After Deployment

- [ ] Services restarted successfully
- [ ] Backend responding: `curl -k https://localhost/api/v11/health`
- [ ] NGINX running: `sudo systemctl status nginx`
- [ ] Frontend accessible: https://dlt.aurigraph.io
- [ ] Login works: admin/admin
- [ ] Dashboard loads without errors
- [ ] Browser console clear (F12)

---

## Performance Expectations

After successful deployment:

**Backend**:
- Response time: < 100ms (p99)
- Uptime: > 99%
- Memory: ~512MB JVM
- CPU: < 70% average

**Frontend**:
- Page load: < 2 seconds
- Time to interactive: < 3 seconds
- No JavaScript errors
- Responsive design working

**Endpoints**:
- Health check: < 50ms
- System info: < 100ms
- Metrics: < 200ms
- Validator list: < 500ms

---

## Automation Options

### Automated Deployment Script

Create a wrapper script to automate the entire process:

```bash
#!/bin/bash
# auto-deploy.sh

PACKAGE="aurigraph-v11-deployment-20251031_173118.tar.gz"
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"

echo "Transferring package..."
scp -P $REMOTE_PORT "$PACKAGE" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

echo "Deploying on remote server..."
ssh -p $REMOTE_PORT "$REMOTE_USER@$REMOTE_HOST" << 'SSH_COMMANDS'
cd /tmp
tar -xzf aurigraph-v11-deployment*.tar.gz
./deploy-on-remote.sh
SSH_COMMANDS

echo "✅ Deployment complete!"
```

### Scheduled Deployments

Use cron to deploy on schedule:

```bash
# Deploy nightly at 2 AM
0 2 * * * /path/to/auto-deploy.sh >> /var/log/aurigraph-deploy.log 2>&1
```

---

## Support & Escalation

### If Deployment Fails

1. Check error message from `deploy-on-remote.sh`
2. Verify all artifacts in package
3. Check remote server logs
4. Perform rollback if needed
5. Review troubleshooting guide

### Log Locations

**Backend Logs**:
```bash
sudo journalctl -u aurigraph-v11 -n 50
sudo journalctl -u aurigraph-v11 -f  # Follow live
```

**NGINX Logs**:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Backup Locations**:
```bash
ls -la /opt/aurigraph/v11/backups/
ls -d /var/www/dlt.aurigraph.io.bak*/
```

---

## Git Information

**Latest Commit**: `5ec3c826`
**Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
**Branch**: main

---

## Next Steps

1. **Transfer Package**: Use SCP to transfer to remote server
2. **SSH to Server**: Connect to `subbu@dlt.aurigraph.io:2235`
3. **Extract Package**: `tar -xzf aurigraph-v11-deployment-*.tar.gz`
4. **Run Deployment**: `./deploy-on-remote.sh`
5. **Test Portal**: Access https://dlt.aurigraph.io with admin/admin
6. **Verify Functionality**: Check dashboard and API endpoints

---

**Last Updated**: October 31, 2025
**Status**: ✅ Ready for SSH-Based Deployment

