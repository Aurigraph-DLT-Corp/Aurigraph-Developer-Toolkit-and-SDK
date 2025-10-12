# RBAC V2 Manual Deployment Guide

**Deployment Date**: October 12, 2025
**Target Server**: dlt.aurigraph.io
**SSH Port**: 2235
**Web Port**: 9003

---

## 📦 Package Contents

This deployment package contains:

- `aurigraph-v11-enterprise-portal.html` (658 KB) - Main portal
- `aurigraph-rbac-system-v2.js` (29 KB) - Core RBAC system
- `aurigraph-rbac-ui.html` (30 KB) - UI components
- `aurigraph-rbac-ui-loader.js` (2 KB) - Dynamic UI loader
- `rbac-admin-setup.html` (18 KB) - Admin management interface
- `verify-rbac-deployment.sh` (11 KB) - Verification script
- `deploy-rbac-remote.sh` (17 KB) - Automated deployment script
- `MANUAL-DEPLOYMENT-GUIDE.md` - This guide

**Total Size**: ~765 KB

---

## 🚀 Deployment Steps

### Option 1: Automated Deployment (Recommended)

If you have network access to the remote server from your local machine:

```bash
# From your local machine in this directory
./deploy-rbac-remote.sh
```

The script will:
1. Verify all required files exist
2. Create deployment package
3. Transfer files to remote server via SCP
4. Configure web server
5. Start the service
6. Verify deployment

---

### Option 2: Manual Deployment

If automated deployment doesn't work, follow these steps:

#### Step 1: Connect to Remote Server

```bash
ssh -p 2235 subbu@dlt.aurigraph.io
# Password: subbuFuture@2025
```

#### Step 2: Create Deployment Directory

```bash
mkdir -p /home/subbu/aurigraph-v11-portal
cd /home/subbu/aurigraph-v11-portal
```

#### Step 3: Transfer Files

**From your local machine** (in a new terminal):

```bash
# Navigate to the deployment package directory
cd /path/to/rbac-v2-deploy-manual/

# Transfer all files using SCP
scp -P 2235 \
    aurigraph-v11-enterprise-portal.html \
    aurigraph-rbac-system-v2.js \
    aurigraph-rbac-ui.html \
    aurigraph-rbac-ui-loader.js \
    rbac-admin-setup.html \
    verify-rbac-deployment.sh \
    subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11-portal/

# OR use rsync for faster transfer
rsync -avz -e "ssh -p 2235" \
    ./ \
    subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11-portal/
```

#### Step 4: Verify Transfer

**On the remote server**:

```bash
cd /home/subbu/aurigraph-v11-portal
ls -lh

# You should see all 7 files listed
# Make verification script executable
chmod +x verify-rbac-deployment.sh

# Run verification
./verify-rbac-deployment.sh
```

#### Step 5: Start Web Server

**Option A: Using Python HTTP Server** (Simple, recommended for testing):

```bash
cd /home/subbu/aurigraph-v11-portal

# Kill any existing process on port 9003
lsof -ti:9003 | xargs kill -9 2>/dev/null || true

# Start server
nohup python3 -m http.server 9003 > server.log 2>&1 &

# Verify it's running
lsof -i :9003
```

**Option B: Using Nginx** (Recommended for production):

```bash
# Install nginx if not already installed
sudo apt-get update
sudo apt-get install -y nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/aurigraph-portal
```

Paste this configuration:

```nginx
server {
    listen 9003;
    server_name dlt.aurigraph.io;

    root /home/subbu/aurigraph-v11-portal;
    index aurigraph-v11-enterprise-portal.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # CORS headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "*" always;

    location / {
        try_files $uri $uri/ /aurigraph-v11-enterprise-portal.html;
    }

    # Admin setup page
    location /admin {
        try_files /rbac-admin-setup.html =404;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security - deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.md$ {
        deny all;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/aurigraph-portal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Verify it's running
sudo systemctl status nginx
```

#### Step 6: Configure Firewall

```bash
# Allow port 9003 through firewall
sudo ufw allow 9003/tcp

# Or using firewalld
sudo firewall-cmd --permanent --add-port=9003/tcp
sudo firewall-cmd --reload

# Verify firewall rules
sudo ufw status
# or
sudo firewall-cmd --list-all
```

#### Step 7: Verify Deployment

**From remote server**:

```bash
# Check if service is running
curl http://localhost:9003/

# Check if it returns HTML
curl http://localhost:9003/ | head -20

# Check admin page
curl http://localhost:9003/rbac-admin-setup.html | head -20
```

**From your local machine**:

```bash
# Check portal access
curl http://dlt.aurigraph.io:9003/ | head -20

# Or open in browser
open http://dlt.aurigraph.io:9003/
```

---

## ✅ Post-Deployment Verification

### 1. Check Service Status

```bash
# If using Python HTTP server
ps aux | grep "python3 -m http.server"
lsof -i :9003

# If using Nginx
sudo systemctl status nginx
sudo nginx -t
```

### 2. Test Portal in Browser

Open in your browser:
- **Portal**: http://dlt.aurigraph.io:9003/
- **Admin**: http://dlt.aurigraph.io:9003/rbac-admin-setup.html

### 3. Create Admin User

1. Open: http://dlt.aurigraph.io:9003/rbac-admin-setup.html
2. Click **"🚀 Create Default Admin"**
3. Note credentials:
   - Email: `admin@aurigraph.io`
   - Password: `admin123`

### 4. Test Guest Registration

1. Open: http://dlt.aurigraph.io:9003/
2. Wait for guest modal (appears after 1 second)
3. Fill registration form with test data
4. Click **"Start Demo"**
5. Verify:
   - No JavaScript errors in console
   - User badge updates
   - Demo banner appears

### 5. Test Admin Login

1. Logout from guest account
2. Login as admin (admin@aurigraph.io / admin123)
3. Click user badge → "Open Admin Panel"
4. Verify admin panel opens with statistics

---

## 🔧 Troubleshooting

### Issue: Cannot Connect to Remote Server

**Symptoms**: `ssh: connect to host dlt.aurigraph.io port 2235: Connection refused`

**Solutions**:
1. Verify server is up: `ping dlt.aurigraph.io`
2. Check SSH service: `sudo systemctl status sshd`
3. Verify port 2235 is listening: `sudo ss -tlnp | grep 2235`
4. Check firewall: `sudo ufw status` or `sudo firewall-cmd --list-all`
5. Try standard port: `ssh subbu@dlt.aurigraph.io` (port 22)

### Issue: Permission Denied When Transferring Files

**Symptoms**: `scp: permission denied`

**Solutions**:
1. Check you're in the home directory: `cd ~`
2. Create directory if missing: `mkdir -p aurigraph-v11-portal`
3. Check directory permissions: `ls -ld aurigraph-v11-portal`
4. Fix permissions: `chmod 755 aurigraph-v11-portal`

### Issue: Port 9003 Already in Use

**Symptoms**: `Address already in use`

**Solutions**:
```bash
# Find process using port 9003
lsof -i :9003

# Kill the process (replace PID)
kill -9 <PID>

# OR kill all processes on port 9003
lsof -ti:9003 | xargs kill -9
```

### Issue: Portal Loads But RBAC Not Working

**Symptoms**: Guest modal doesn't appear, no user badge

**Solutions**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify all files were transferred:
   ```bash
   ls -lh /home/subbu/aurigraph-v11-portal/
   ```
4. Check file permissions are readable:
   ```bash
   chmod 644 /home/subbu/aurigraph-v11-portal/*.html
   chmod 644 /home/subbu/aurigraph-v11-portal/*.js
   ```
5. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

### Issue: Nginx Configuration Error

**Symptoms**: `nginx: configuration file /etc/nginx/nginx.conf test failed`

**Solutions**:
```bash
# Check nginx error log
sudo tail -50 /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Common issues:
# - Missing semicolons
# - Incorrect file paths
# - Syntax errors in server block
```

### Issue: Cannot Access from External Network

**Symptoms**: Works on server (localhost) but not externally

**Solutions**:
1. Check firewall allows port 9003:
   ```bash
   sudo ufw allow 9003/tcp
   sudo firewall-cmd --permanent --add-port=9003/tcp
   sudo firewall-cmd --reload
   ```

2. Check nginx is listening on correct interface:
   ```bash
   sudo ss -tlnp | grep 9003
   # Should show 0.0.0.0:9003 or ::9003 (not 127.0.0.1:9003)
   ```

3. If nginx shows 127.0.0.1:9003, update config:
   ```nginx
   listen 9003;  # NOT: listen 127.0.0.1:9003;
   ```

---

## 🔄 Service Management

### Python HTTP Server

**Start**:
```bash
cd /home/subbu/aurigraph-v11-portal
nohup python3 -m http.server 9003 > server.log 2>&1 &
```

**Stop**:
```bash
lsof -ti:9003 | xargs kill -9
```

**View Logs**:
```bash
tail -f /home/subbu/aurigraph-v11-portal/server.log
```

**Auto-start on Boot** (systemd):

Create service file:
```bash
sudo nano /etc/systemd/system/aurigraph-portal.service
```

Paste:
```ini
[Unit]
Description=Aurigraph V11 Enterprise Portal
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/home/subbu/aurigraph-v11-portal
ExecStart=/usr/bin/python3 -m http.server 9003
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-portal
sudo systemctl start aurigraph-portal
sudo systemctl status aurigraph-portal
```

### Nginx

**Start**: `sudo systemctl start nginx`
**Stop**: `sudo systemctl stop nginx`
**Restart**: `sudo systemctl restart nginx`
**Reload** (without dropping connections): `sudo systemctl reload nginx`
**Status**: `sudo systemctl status nginx`
**Enable auto-start**: `sudo systemctl enable nginx`
**View logs**:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Monitoring & Maintenance

### Check Service Health

```bash
# Check if web service is running
curl -I http://localhost:9003/

# Check response time
time curl -s http://localhost:9003/ > /dev/null

# Monitor server logs
tail -f server.log  # Python
sudo tail -f /var/log/nginx/access.log  # Nginx
```

### View User Registrations

```bash
# SSH to server
ssh -p 2235 subbu@dlt.aurigraph.io

# Install jq for JSON parsing (if not installed)
sudo apt-get install jq

# View user data (if stored on server)
# This depends on your backend implementation
```

### Backup Deployment

```bash
# Create backup of current deployment
cd /home/subbu
tar -czf aurigraph-portal-backup-$(date +%Y%m%d).tar.gz aurigraph-v11-portal/

# Restore from backup
tar -xzf aurigraph-portal-backup-20251012.tar.gz
```

### Update Deployment

```bash
# Transfer new files from local machine
scp -P 2235 aurigraph-v11-enterprise-portal.html \
    subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11-portal/

# OR use the deployment script
./deploy-rbac-remote.sh
```

---

## 🎯 Success Criteria

Deployment is successful when:

- [ ] All files transferred to remote server
- [ ] Web service running on port 9003
- [ ] Portal accessible at http://dlt.aurigraph.io:9003/
- [ ] Admin page accessible at http://dlt.aurigraph.io:9003/rbac-admin-setup.html
- [ ] Guest modal appears after 1 second
- [ ] Guest registration works correctly
- [ ] Admin login works
- [ ] Admin panel shows statistics
- [ ] No JavaScript errors in browser console
- [ ] RBAC security features working (XSS protection, validation, rate limiting)

---

## 📞 Support

If you encounter issues during deployment:

1. **Check Logs**:
   - Python: `tail -f /home/subbu/aurigraph-v11-portal/server.log`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

2. **Verify Files**:
   ```bash
   cd /home/subbu/aurigraph-v11-portal
   ./verify-rbac-deployment.sh
   ```

3. **Check Documentation**:
   - RBAC-V2-DEPLOYMENT-COMPLETE.md
   - RBAC-QUICK-START-GUIDE.md
   - RBAC-REFACTORING-REPORT.md

4. **Test Locally First**:
   ```bash
   # On your local machine
   cd /path/to/deployment/package
   python3 -m http.server 8000
   # Open: http://localhost:8000/
   ```

---

## 🎉 Post-Deployment

Once deployment is successful:

1. **Create Admin User**:
   - Open admin setup page
   - Create default admin or custom admin

2. **Test All Features**:
   - Follow RBAC-QUICK-START-GUIDE.md
   - Test guest registration
   - Test security features
   - Test admin panel

3. **Monitor Performance**:
   - Track page load times
   - Monitor guest registrations
   - Check for JavaScript errors

4. **Plan Enhancements**:
   - Review RBAC-NEXT-SPRINT-ENHANCEMENTS.md
   - Plan backend integration
   - Plan email verification
   - Plan 2FA implementation

---

## 📝 Deployment Checklist

Use this checklist to track your deployment:

- [ ] Received deployment package
- [ ] Reviewed deployment guide
- [ ] Connected to remote server
- [ ] Created deployment directory
- [ ] Transferred all files
- [ ] Verified file transfer
- [ ] Started web service (Python or Nginx)
- [ ] Configured firewall
- [ ] Tested portal access
- [ ] Created admin user
- [ ] Tested guest registration
- [ ] Tested admin panel
- [ ] Verified no errors in console
- [ ] Configured auto-start (optional)
- [ ] Set up monitoring (optional)
- [ ] Backed up deployment
- [ ] Documented any issues
- [ ] Notified team of completion

---

**Deployment Guide Version**: 1.0
**Last Updated**: October 12, 2025
**Target Server**: dlt.aurigraph.io:9003

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*

*Co-Authored-By: Claude <noreply@anthropic.com>*
