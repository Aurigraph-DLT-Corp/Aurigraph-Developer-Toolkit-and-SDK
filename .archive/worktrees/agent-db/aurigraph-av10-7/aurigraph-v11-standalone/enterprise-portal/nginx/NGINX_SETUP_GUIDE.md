# NGINX Proxy & HTTPS Setup Guide - Production Deployment

## 📋 Overview

This guide explains how to configure and deploy NGINX as a reverse proxy for the Aurigraph Enterprise Portal with HTTPS/SSL support.

**Features Included:**
- ✅ Reverse proxy for backend API (port 9003)
- ✅ Frontend static file serving
- ✅ HTTPS/SSL with Let's Encrypt
- ✅ Rate limiting (100 req/s API, 10 req/s admin, 5 req/m auth)
- ✅ IP-based firewall for admin endpoints
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ WebSocket support for real-time updates
- ✅ Gzip compression
- ✅ Caching for static assets (1 year)
- ✅ Request/response buffering
- ✅ HTTP/2 support
- ✅ Health check endpoints
- ✅ Rollback capability

---

## 🚀 Quick Start - 5 Minutes

### Prerequisites

```bash
# 1. SSH access to remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# 2. Frontend must be built locally
cd enterprise-portal
npm run build  # Creates dist/ directory

# 3. Backend must be running
# On remote server: java -jar target/quarkus-app/quarkus-run.jar (port 9003)
```

### Deployment Steps

```bash
# 1. Navigate to NGINX directory
cd enterprise-portal/nginx/

# 2. Test NGINX configuration (no changes made)
./deploy-nginx.sh --test

# 3. Deploy to production
./deploy-nginx.sh --deploy

# 4. Setup SSL certificate (first time only)
./deploy-nginx.sh --setup-ssl

# Done! Access at: https://dlt.aurigraph.io
```

---

## 🏗️ Architecture

```
User Browser
    ↓ HTTPS (443)
    ↓
┌─────────────────────────────────────┐
│         NGINX Reverse Proxy          │
│  - SSL/TLS Termination              │
│  - Rate Limiting & Firewall         │
│  - Static File Serving              │
│  - Request Routing                  │
└─────────────────────────────────────┘
    ↓ HTTP (80) + Backend APIs        ↓ Backend APIs
    ↓                                  ↓
┌──────────────────┐           ┌──────────────────┐
│  Frontend Files  │           │  Quarkus Backend │
│  /var/www/...   │           │  localhost:9003  │
└──────────────────┘           └──────────────────┘
```

---

## 📋 Installation Steps (Manual)

If you prefer to setup manually instead of using the deployment script:

### Step 1: Install NGINX

```bash
# SSH into remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# Install NGINX
sudo apt-get update
sudo apt-get install -y nginx

# Verify installation
nginx -v
```

### Step 2: Copy Configuration

```bash
# On local machine
cd enterprise-portal/nginx/

# Copy configuration file
scp -P 2235 aurigraph-portal.conf subbu@dlt.aurigraph.io:/tmp/

# On remote server
sudo mv /tmp/aurigraph-portal.conf /etc/nginx/sites-available/aurigraph-portal
sudo chown root:root /etc/nginx/sites-available/aurigraph-portal
sudo chmod 644 /etc/nginx/sites-available/aurigraph-portal

# Enable site
sudo ln -sf /etc/nginx/sites-available/aurigraph-portal /etc/nginx/sites-enabled/aurigraph-portal

# Disable default site
sudo rm -f /etc/nginx/sites-enabled/default
```

### Step 3: Create Frontend Directory

```bash
# On remote server
sudo mkdir -p /var/www/aurigraph-portal/dist
sudo chown -R subbu:subbu /var/www/aurigraph-portal
```

### Step 4: Upload Frontend Files

```bash
# On local machine
cd enterprise-portal
npm run build

# Upload dist directory
rsync -avz --delete -e "ssh -p 2235" dist/ subbu@dlt.aurigraph.io:/var/www/aurigraph-portal/dist/
```

### Step 5: Test NGINX Configuration

```bash
# On remote server
sudo nginx -t

# Output should be:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 6: Start NGINX

```bash
# On remote server
sudo systemctl start nginx
sudo systemctl enable nginx  # Enable on boot

# Verify status
sudo systemctl status nginx
```

### Step 7: Setup SSL (Let's Encrypt)

```bash
# On remote server
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d dlt.aurigraph.io --non-interactive --agree-tos -m admin@aurigraph.io

# Auto-renewal is enabled by default
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 8: Verify HTTPS

```bash
# Test in browser or via curl
curl -I https://dlt.aurigraph.io

# Should return: HTTP/2 200
```

---

## 🔧 Configuration Details

### Rate Limiting

The configuration includes rate limiting zones (currently commented out):

```nginx
# Add these to /etc/nginx/nginx.conf in the http context:

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;     # 100 req/sec
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=10r/s;   # 10 req/sec
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;     # 5 req/min
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
```

To enable, uncomment lines like:
```nginx
limit_req zone=api_limit burst=200 nodelay;
```

### Firewall Rules (Admin Access)

The configuration restricts admin endpoints to specific IP ranges:

```nginx
location /api/v11/admin/ {
    allow 192.168.0.0/16;    # Internal network
    allow 10.0.0.0/8;        # Internal network
    allow 172.16.0.0/12;     # Internal network
    allow 203.0.113.0/24;    # VPN (customize with your VPN range)
    deny all;
}
```

**To customize:**
1. Edit `aurigraph-portal.conf`
2. Update IP ranges for your environment
3. Redeploy: `./deploy-nginx.sh --deploy`

### Security Headers

The configuration includes production-grade security headers:

- **HSTS**: Forces HTTPS for 730 days (2 years)
- **X-Frame-Options**: SAMEORIGIN (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block
- **Content-Security-Policy**: Restricts script execution
- **Permissions-Policy**: Disables sensitive features (geolocation, microphone, camera)

### WebSocket Support

WebSocket connections are supported for real-time updates:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

This allows features like live transaction streaming, real-time metrics updates, etc.

---

## 📊 Endpoint Configuration

### Frontend (Static Files)

```
GET / → /var/www/aurigraph-portal/dist/index.html
GET /assets/* → /var/www/aurigraph-portal/dist/assets/*
```

**Caching:**
- HTML: No cache (always fresh)
- Static assets (.js, .css, .png, .jpg, etc.): 1 year cache with immutable flag

### Backend API Routes

```
GET /api/v11/health → localhost:9003/api/v11/health (no rate limit)
POST /api/v11/auth/* → localhost:9003/api/v11/auth/* (5 req/min)
GET /api/v11/admin/* → localhost:9003/api/v11/admin/* (10 req/s, IP-restricted)
GET /api/v11/* → localhost:9003/api/v11/* (100 req/s)
GET /api/v11/metrics → localhost:9003/api/v11/metrics (IP-restricted to 127.0.0.1)
```

### Keycloak IAM Proxy

```
GET /auth/* → iam2.aurigraph.io (OAuth 2.0 integration)
```

---

## 🛠️ Common Maintenance Tasks

### Check Status

```bash
./deploy-nginx.sh --status

# Or manually:
ssh -p 2235 subbu@dlt.aurigraph.io "sudo systemctl status nginx"
```

### View Logs

```bash
# Access logs
ssh -p 2235 subbu@dlt.aurigraph.io "sudo tail -f /var/log/nginx/aurigraph-portal-access.log"

# Error logs
ssh -p 2235 subbu@dlt.aurigraph.io "sudo tail -f /var/log/nginx/aurigraph-portal-error.log"
```

### Reload Configuration

```bash
ssh -p 2235 subbu@dlt.aurigraph.io "sudo systemctl reload nginx"

# Or using the script:
./deploy-nginx.sh --deploy
```

### Renew SSL Certificate

```bash
./deploy-nginx.sh --setup-ssl

# Or manually:
ssh -p 2235 subbu@dlt.aurigraph.io "sudo certbot renew"
```

### Rollback Configuration

```bash
./deploy-nginx.sh --rollback
# Enter the backup directory path when prompted (e.g., /tmp/nginx-backup-20250119-120000)
```

---

## ⚠️ Troubleshooting

### NGINX Won't Start

```bash
# Test configuration
ssh -p 2235 subbu@dlt.aurigraph.io "sudo nginx -t"

# Check service status
ssh -p 2235 subbu@dlt.aurigraph.io "sudo systemctl status nginx"

# View error logs
ssh -p 2235 subbu@dlt.aurigraph.io "sudo tail -n 50 /var/log/nginx/error.log"
```

### Backend Connection Refused

```bash
# Check if backend is running
ssh -p 2235 subbu@dlt.aurigraph.io "curl http://localhost:9003/api/v11/health"

# Check if backend is listening on port 9003
ssh -p 2235 subbu@dlt.aurigraph.io "sudo lsof -i :9003"
```

### SSL Certificate Error

```bash
# Check certificate status
ssh -p 2235 subbu@dlt.aurigraph.io "sudo certbot certificates"

# Renew certificate
ssh -p 2235 subbu@dlt.aurigraph.io "sudo certbot renew --force-renewal"

# Reload NGINX
ssh -p 2235 subbu@dlt.aurigraph.io "sudo systemctl reload nginx"
```

### 502 Bad Gateway

This means NGINX is running but cannot reach the backend:

```bash
# Check backend status
ssh -p 2235 subbu@dlt.aurigraph.io "curl http://localhost:9003/api/v11/health"

# Check NGINX error logs
ssh -p 2235 subbu@dlt.aurigraph.io "sudo tail -n 20 /var/log/nginx/aurigraph-portal-error.log"
```

### 403 Forbidden (Admin Endpoints)

This means your IP is not whitelisted for admin access:

1. Identify your IP: `curl https://icanhazip.com`
2. Add it to the firewall rules in `aurigraph-portal.conf`
3. Redeploy: `./deploy-nginx.sh --deploy`

---

## 🔒 Firewall Setup

For security, you should also setup OS-level firewall rules:

```bash
# Copy firewall setup script
scp -P 2235 setup-firewall.sh subbu@dlt.aurigraph.io:/tmp/

# On remote server
ssh -p 2235 subbu@dlt.aurigraph.io
sudo chmod +x /tmp/setup-firewall.sh
sudo /tmp/setup-firewall.sh --setup
```

This will:
- Allow HTTPS (443)
- Allow SSH (2235)
- Block all other external ports
- Allow internal network access

---

## 📊 Performance Tuning

### Enable Brotli Compression (Optional)

For better compression than gzip:

```bash
# Install brotli module
ssh -p 2235 subbu@dlt.aurigraph.io "sudo apt-get install -y brotli"

# Enable in config
# Uncomment these lines in aurigraph-portal.conf:
# brotli on;
# brotli_comp_level 6;
# brotli_types ...
```

### Increase Buffer Sizes

For large API responses:

```nginx
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

### Connection Pool

Keep connections to backend alive:

```nginx
upstream backend_api {
    server localhost:9003 max_fails=3 fail_timeout=30s;
    keepalive 32;  # Number of keep-alive connections
}
```

---

## 📈 Monitoring

### NGINX Status Endpoint

```bash
# View NGINX metrics (localhost only)
curl http://localhost:8080/nginx_status

# Output shows:
# - Active connections
# - Accepts, handled, requests
# - Reading, Writing, Waiting
```

### Prometheus Metrics (Optional)

To integrate with Prometheus for monitoring:

1. Install nginx-prometheus-exporter
2. Add metrics endpoint
3. Configure Prometheus scrape config

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] NGINX is running: `sudo systemctl status nginx`
- [ ] Configuration is valid: `sudo nginx -t`
- [ ] Frontend loads: `curl https://dlt.aurigraph.io`
- [ ] Backend API works: `curl https://dlt.aurigraph.io/api/v11/health`
- [ ] SSL certificate is valid: `curl -v https://dlt.aurigraph.io`
- [ ] Redirects to HTTPS: `curl -I http://dlt.aurigraph.io`
- [ ] Rate limiting works (if enabled): Make 101 requests in 1 second
- [ ] Admin endpoints blocked: Try accessing from non-whitelisted IP
- [ ] Static assets cached: Check Cache-Control headers for .js/.css files
- [ ] Security headers present: Check response headers

---

## 🔄 Backup & Recovery

### Automatic Backups

The `deploy-nginx.sh` script automatically creates backups before each deployment:

```bash
/tmp/nginx-backup-20250119-120000/
├── aurigraph-portal          # Old NGINX config
├── aurigraph-portal-access.log   # Old access logs
└── aurigraph-portal-error.log    # Old error logs
```

### Manual Backup

```bash
ssh -p 2235 subbu@dlt.aurigraph.io
sudo cp /etc/nginx/sites-available/aurigraph-portal ~/aurigraph-portal.conf.backup
sudo cp -r /var/log/nginx/ ~/nginx-logs-backup/
```

### Restore from Backup

```bash
./deploy-nginx.sh --rollback
# Enter backup directory path when prompted
```

---

## 📚 Documentation References

- **NGINX Configuration**: `aurigraph-portal.conf`
- **Deployment Script**: `deploy-nginx.sh`
- **Firewall Setup**: `setup-firewall.sh`
- **Quick Start**: `QUICK_START.md`
- **README**: `README.md`

---

## 🆘 Support

**Issues or Questions?**

1. Check logs: `sudo tail -f /var/log/nginx/aurigraph-portal-error.log`
2. Test config: `sudo nginx -t`
3. Review JIRA: [AV11-421](https://aurigraphdlt.atlassian.net/browse/AV11-421)
4. Check Confluence: ADTAS space
5. GitHub: [Aurigraph-DLT](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT)

---

**Last Updated**: October 31, 2025
**Version**: 4.3.2
**Status**: Production Ready ✅
