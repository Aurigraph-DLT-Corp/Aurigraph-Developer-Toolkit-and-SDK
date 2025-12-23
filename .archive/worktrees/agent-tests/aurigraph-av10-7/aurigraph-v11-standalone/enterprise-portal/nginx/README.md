# Aurigraph Enterprise Portal - NGINX Proxy Configuration

## Overview

This directory contains the NGINX reverse proxy configuration for the Aurigraph Enterprise Portal deployment. The configuration provides:

- **Reverse Proxy**: Routes frontend and backend traffic
- **Firewall**: IP-based access control for admin endpoints
- **Rate Limiting**: Protects against DDoS and abuse
- **SSL/TLS**: Modern encryption with TLS 1.2/1.3
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Compression**: Gzip for reduced bandwidth
- **Caching**: Static asset caching for performance
- **Load Balancing**: Ready for multi-instance deployment

## Files

```
nginx/
├── aurigraph-portal.conf   # Main NGINX configuration
├── deploy-nginx.sh         # Deployment automation script
└── README.md              # This file
```

## Quick Start

### 1. Test Configuration

Test the NGINX configuration syntax before deployment:

```bash
cd nginx/
./deploy-nginx.sh --test
```

### 2. Deploy to Production

Deploy NGINX configuration and frontend files:

```bash
# With SSH key authentication
./deploy-nginx.sh --deploy

# With password authentication
REMOTE_PASSWORD='your-password' ./deploy-nginx.sh --deploy
```

### 3. Check Status

Verify NGINX is running correctly:

```bash
./deploy-nginx.sh --status
```

## Configuration Details

### Backend Upstream

The configuration proxies requests to the V11 Java/Quarkus backend:

```nginx
upstream backend_api {
    server localhost:9003 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

**Port 9003**: V11 Quarkus application
- REST API: `/api/v11/*`
- Health: `/api/v11/health`
- Metrics: `/api/v11/metrics`

### Rate Limiting

Three rate limiting zones protect different endpoint types:

| Zone | Rate | Burst | Endpoints |
|------|------|-------|-----------|
| `api_limit` | 100 req/s | 200 | `/api/v11/*` |
| `admin_limit` | 10 req/s | 20 | `/api/v11/admin/*` |
| `auth_limit` | 5 req/m | 5 | `/api/v11/auth/*` |

**Connection Limit**: 50 concurrent connections per IP

### Firewall Rules

Admin endpoints are restricted to specific IP ranges:

```nginx
location /api/v11/admin/ {
    # Internal networks
    allow 192.168.0.0/16;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;

    # VPN range (customize)
    allow 203.0.113.0/24;

    # Deny all other IPs
    deny all;
}
```

**Customize** the IP ranges in `aurigraph-portal.conf` for your environment.

### SSL/TLS Configuration

Modern SSL/TLS settings based on Mozilla Intermediate profile:

- **Protocols**: TLS 1.2, TLS 1.3
- **Ciphers**: Strong cipher suites only
- **HSTS**: Enabled with 2-year max-age
- **OCSP Stapling**: Enabled for performance
- **Session Cache**: 50MB shared cache, 1-day timeout

**Certificate Location**: `/etc/letsencrypt/live/dlt.aurigraph.io/`

### Security Headers

Comprehensive security headers protect against common attacks:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | max-age=63072000 | Force HTTPS |
| `X-Frame-Options` | SAMEORIGIN | Prevent clickjacking |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `X-XSS-Protection` | 1; mode=block | XSS protection |
| `Content-Security-Policy` | Restrictive policy | Prevent XSS/injection |
| `Referrer-Policy` | strict-origin-when-cross-origin | Privacy |

### Static File Caching

Aggressive caching for static assets:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Compression

Gzip compression enabled for text-based content:

- **Level**: 6 (balanced)
- **Types**: HTML, CSS, JS, JSON, XML, fonts
- **Vary**: Enabled for proper caching

## Deployment Script

### Commands

```bash
# Test configuration syntax
./deploy-nginx.sh --test

# Deploy configuration and frontend
./deploy-nginx.sh --deploy

# Rollback to previous configuration
./deploy-nginx.sh --rollback

# Check NGINX status
./deploy-nginx.sh --status

# Setup SSL with Let's Encrypt
./deploy-nginx.sh --setup-ssl

# Display help
./deploy-nginx.sh --help
```

### Features

- ✅ **Automatic Backup**: Creates timestamped backup before deployment
- ✅ **Syntax Testing**: Validates configuration before applying
- ✅ **Safe Rollback**: Restore previous configuration if needed
- ✅ **Frontend Deployment**: Uploads production build with rsync
- ✅ **Color Output**: Clear status messages with colors
- ✅ **Error Handling**: Exits on failure to prevent bad deployments

### Environment Variables

```bash
# Remote server password (optional)
export REMOTE_PASSWORD='your-password'

# Or use SSH key authentication (recommended)
ssh-copy-id -p 22 subbu@dlt.aurigraph.io
```

## Manual Deployment

If you prefer manual deployment:

### 1. Upload Configuration

```bash
scp -P 22 aurigraph-portal.conf subbu@dlt.aurigraph.io:/tmp/
```

### 2. Install on Server

```bash
ssh -p 22 subbu@dlt.aurigraph.io

# Backup current config
sudo cp /etc/nginx/sites-available/aurigraph-portal /tmp/backup-$(date +%Y%m%d)

# Install new config
sudo mv /tmp/aurigraph-portal.conf /etc/nginx/sites-available/aurigraph-portal
sudo chown root:root /etc/nginx/sites-available/aurigraph-portal
sudo chmod 644 /etc/nginx/sites-available/aurigraph-portal

# Enable site
sudo ln -sf /etc/nginx/sites-available/aurigraph-portal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### 3. Deploy Frontend

```bash
# Build frontend
cd ../
npm run build

# Upload to server
rsync -avz --delete dist/ subbu@dlt.aurigraph.io:/var/www/aurigraph-portal/dist/
```

## SSL Certificate Setup

### Let's Encrypt (Recommended)

Use the automated script:

```bash
./deploy-nginx.sh --setup-ssl
```

Or manually:

```bash
ssh subbu@dlt.aurigraph.io

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d dlt.aurigraph.io

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### Custom Certificate

If using a custom SSL certificate:

```bash
# Upload certificate files
scp fullchain.pem subbu@dlt.aurigraph.io:/tmp/
scp privkey.pem subbu@dlt.aurigraph.io:/tmp/

# Install on server
ssh subbu@dlt.aurigraph.io
sudo mkdir -p /etc/ssl/aurigraph/
sudo mv /tmp/fullchain.pem /etc/ssl/aurigraph/
sudo mv /tmp/privkey.pem /etc/ssl/aurigraph/
sudo chmod 600 /etc/ssl/aurigraph/privkey.pem

# Update nginx config to point to new location
sudo nano /etc/nginx/sites-available/aurigraph-portal
# Change ssl_certificate and ssl_certificate_key paths
```

## Monitoring & Logs

### Access Logs

```bash
ssh subbu@dlt.aurigraph.io
sudo tail -f /var/log/nginx/aurigraph-portal-access.log
```

### Error Logs

```bash
sudo tail -f /var/log/nginx/aurigraph-portal-error.log
```

### NGINX Status

```bash
# On server (localhost only)
curl http://localhost:8080/nginx_status
```

Output:
```
Active connections: 123
server accepts handled requests
 1234 1234 5678
Reading: 1 Writing: 5 Waiting: 117
```

### Log Analysis

Common commands for log analysis:

```bash
# Top 10 IPs by request count
sudo awk '{print $1}' /var/log/nginx/aurigraph-portal-access.log | sort | uniq -c | sort -rn | head -10

# HTTP status code distribution
sudo awk '{print $9}' /var/log/nginx/aurigraph-portal-access.log | sort | uniq -c | sort -rn

# Top 10 requested URLs
sudo awk '{print $7}' /var/log/nginx/aurigraph-portal-access.log | sort | uniq -c | sort -rn | head -10

# Average response time
sudo awk '{sum+=$10; count++} END {print sum/count}' /var/log/nginx/aurigraph-portal-access.log
```

## Troubleshooting

### Configuration Test Fails

```bash
# Check syntax errors
sudo nginx -t

# View detailed error
sudo nginx -T
```

### NGINX Won't Start

```bash
# Check service status
sudo systemctl status nginx

# View recent errors
sudo journalctl -u nginx -n 50 --no-pager

# Check port conflicts
sudo lsof -i :443
sudo lsof -i :80
```

### Backend Connection Errors

```bash
# Verify backend is running
curl http://localhost:9003/api/v11/health

# Check backend logs
journalctl -u aurigraph-v11 -f

# Test backend directly
curl -v http://localhost:9003/api/v11/info
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test SSL configuration
openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io
```

### Rate Limiting Too Aggressive

Adjust rate limits in `aurigraph-portal.conf`:

```nginx
# Increase API rate limit from 100 to 200 req/s
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=200r/s;

# Increase burst from 200 to 500
location /api/v11/ {
    limit_req zone=api_limit burst=500 nodelay;
    ...
}
```

Then reload: `sudo systemctl reload nginx`

## Performance Tuning

### Worker Processes

Add to `/etc/nginx/nginx.conf`:

```nginx
# Set to number of CPU cores
worker_processes auto;

# Increase worker connections
events {
    worker_connections 4096;
    use epoll;  # Linux
}
```

### Buffer Sizes

For high-traffic sites, increase buffers:

```nginx
http {
    # Request buffering
    client_body_buffer_size 128k;
    client_max_body_size 20M;

    # Proxy buffering
    proxy_buffer_size 128k;
    proxy_buffers 8 128k;
    proxy_busy_buffers_size 256k;
}
```

### Connection Keepalive

Optimize keepalive settings:

```nginx
http {
    keepalive_timeout 65s;
    keepalive_requests 100;

    upstream backend_api {
        server localhost:9003;
        keepalive 64;  # Increase from 32
    }
}
```

## Security Hardening

### Additional Recommendations

1. **Disable Server Tokens**:
   ```nginx
   http {
       server_tokens off;
   }
   ```

2. **Add ModSecurity WAF** (optional):
   ```bash
   sudo apt-get install -y libmodsecurity3 libnginx-mod-http-modsecurity
   ```

3. **Implement Fail2Ban**:
   ```bash
   sudo apt-get install -y fail2ban
   # Configure /etc/fail2ban/jail.local for NGINX
   ```

4. **Regular Security Updates**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade nginx -y
   ```

## Customization

### Adding New Backend Services

To add additional backend services:

```nginx
upstream new_service {
    server localhost:9010;
    keepalive 16;
}

location /api/new/ {
    proxy_pass http://new_service;
    # ... proxy settings
}
```

### Multi-Instance Load Balancing

For high availability:

```nginx
upstream backend_api {
    # Round-robin (default)
    server localhost:9003 weight=1;
    server localhost:9013 weight=1;
    server localhost:9023 weight=1 backup;

    # Or use least connections
    least_conn;

    # Or use IP hash for session persistence
    # ip_hash;

    keepalive 64;
}
```

### Custom Error Pages

Create custom error pages:

```bash
# Create error page
cat > /var/www/aurigraph-portal/dist/custom-404.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Page Not Found</title></head>
<body><h1>404 - Page Not Found</h1></body>
</html>
EOF

# Update nginx config
error_page 404 /custom-404.html;
location = /custom-404.html {
    root /var/www/aurigraph-portal/dist;
    internal;
}
```

## References

- [NGINX Official Documentation](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)

## Support

For issues or questions:

- **JIRA**: https://aurigraphdlt.atlassian.net/browse/AV11-421
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Documentation**: `/docs/infrastructure/nginx-proxy.md`

---

**Version**: 4.3.2
**Last Updated**: 2025-10-19
**Maintainer**: Aurigraph DevOps Team
