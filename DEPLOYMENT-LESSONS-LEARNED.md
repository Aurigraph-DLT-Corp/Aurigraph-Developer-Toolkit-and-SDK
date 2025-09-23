# Deployment Lessons Learned - dlt.aurigraph.io

## Server Access
- SSH: `ssh -p 2235 subbu@dlt.aurigraph.io`
- Domain: dlt.aurigraph.io
- SSL Certificates: `/etc/letsencrypt/live/aurcrt/` (Note: These are for aurigraph.io, not dlt.aurigraph.io)

## Common Issues and Fixes

### 1. SSL Certificate Mismatch
**Problem**: SSL certificates at `/etc/letsencrypt/live/aurcrt/` are for `aurigraph.io`, not `dlt.aurigraph.io`
**Solution**: Generated self-signed certificate for dlt.aurigraph.io
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /tmp/dlt.key -out /tmp/dlt.crt \
  -subj '/CN=dlt.aurigraph.io'
```

### 2. Backend Service Container Name Resolution
**Problem**: Nginx configuration using wrong backend hostname
**Error**: `host not found in upstream "backend"`
**Fix**: Use correct container name `aurigraph-backend` instead of `backend`

### 3. Docker Container Name Conflicts
**Problem**: Container names already in use when restarting
**Solution**: Always stop and remove containers before recreating
```bash
docker stop aurigraph-nginx aurigraph-backend aurigraph-postgres aurigraph-redis
docker rm aurigraph-nginx aurigraph-backend aurigraph-postgres aurigraph-redis
```

### 4. WebSocket Port 9005 Issues
**Problem**: Frontend hardcoded to use `wss://dlt.aurigraph.io:9005/ws`
**Solution**: Configure nginx to proxy WebSocket at `/ws` path and update frontend configuration

### 5. File Permission Issues
**Problem**: Cannot write to `/var/www/html/` directly via SCP
**Solution**: Upload to home directory first, then move with sudo
```bash
scp -P 2235 files.tar.gz subbu@dlt.aurigraph.io:/home/subbu/
ssh -p 2235 subbu@dlt.aurigraph.io "tar xzf files.tar.gz && sudo cp -r build/* /var/www/html/"
```

### 6. Nginx HTTP2 Deprecation Warning
**Problem**: `listen 443 ssl http2` syntax is deprecated
**Solution**: Use separate `http2 on;` directive
```nginx
listen 443 ssl;
http2 on;
```

### 7. Backend JAR Missing
**Problem**: Backend container keeps restarting - no JAR file
**Note**: Backend JAR needs to be built and deployed to `/home/subbu/aurigraph-backend.jar`

### 8. HTTPS/SSL Not Working
**Problem**: SSL handshake failures, connection closed errors
**Solution**: 
- Mount SSL certificates correctly in Docker
- Use `/tmp` as SSL directory for self-signed certs
- Ensure nginx configuration has proper SSL settings

## Working Docker Configuration

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    container_name: aurigraph-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/www/html:/usr/share/nginx/html:ro
      - /tmp/nginx-config.conf:/etc/nginx/conf.d/default.conf:ro
      - /tmp:/etc/nginx/ssl:ro
    restart: always
```

## Working Nginx Configuration Structure

```nginx
server {
    listen 80;
    server_name dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name dlt.aurigraph.io;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    root /usr/share/nginx/html;
    
    # API endpoints with mock responses when backend not available
    location /api/ {
        default_type application/json;
        return 200 '{"status": "ok"}';
    }
    
    # React app
    location / {
        try_files $uri /index.html;
    }
}
```

## IAM2 Integration
- Server: https://iam2.aurigraph.io/
- Realm: AurigraphDLT
- Username: aurdltadmin
- Password: Column@2025
- Configure in `.env.production` before building

## Deployment Checklist
1. ✅ Build frontend with correct environment variables
2. ✅ Create tarball and copy to server
3. ✅ Stop existing containers
4. ✅ Deploy new frontend files
5. ✅ Update nginx configuration
6. ✅ Start containers with correct mounts
7. ✅ Test HTTPS access
8. ✅ Verify API endpoints
9. ⚠️ Deploy backend JAR when available

## Quick Deployment Commands
```bash
# Build and package frontend
npm run build
tar czf ui-build.tar.gz build

# Deploy to server
scp -P 2235 ui-build.tar.gz subbu@dlt.aurigraph.io:/home/subbu/
ssh -p 2235 subbu@dlt.aurigraph.io "
  tar xzf ui-build.tar.gz && 
  sudo rm -rf /var/www/html/* && 
  sudo cp -r build/* /var/www/html/ && 
  sudo chown -R www-data:www-data /var/www/html
"

# Restart nginx
ssh -p 2235 subbu@dlt.aurigraph.io "docker restart aurigraph-nginx"
```

## Current Status
- ✅ HTTPS working with self-signed certificate
- ✅ Frontend deployed and accessible
- ✅ IAM2 authentication configured
- ✅ Mock API endpoints working
- ⚠️ Backend service needs JAR deployment
- ⚠️ Need proper SSL certificate for dlt.aurigraph.io (currently using self-signed)